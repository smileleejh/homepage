using System.Threading.Channels;
using backend.Data;
using backend.Domain;

namespace backend.Infrastructure;

/// <summary>발송 요청 1건 — 큐에 실려 백그라운드에서 처리된다.</summary>
public record EmailJob(
    EmailType Type,
    string Recipient,
    string Subject,
    string Body,
    int? RelatedInquiryId = null);

/// <summary>
/// 이메일 발송 대기열. 요청을 처리하는 스레드는 넣기만 하고 곧바로 응답한다 —
/// 발송(SMTP 왕복)이 문의 접수 응답을 붙잡거나, 메일 서버 장애가 접수 실패로 번지지 않게 한다. (DESIGN §4.7)
/// </summary>
public interface IEmailQueue
{
  /// <summary>대기열에 넣는다. 가득 차 있으면 false — 호출측이 그 사실을 알 수 있어야 한다.</summary>
  bool TryEnqueue(EmailJob job);
}

/// <summary>
/// 인메모리 대기열. 프로세스가 죽으면 대기 중인 메일도 사라지므로,
/// 유실이 곤란해지면 외부 큐(Service Bus/SQS 등)로 교체한다.
/// </summary>
public class EmailQueue : IEmailQueue
{
  // 한도를 두지 않으면 발송이 막혔을 때 대기열이 메모리를 계속 먹는다.
  private const int Capacity = 500;

  private readonly Channel<EmailJob> channel = Channel.CreateBounded<EmailJob>(
      new BoundedChannelOptions(Capacity)
      {
        // Wait 모드에서 TryWrite는 가득 차면 기다리지 않고 false를 돌려준다
        FullMode = BoundedChannelFullMode.Wait,
        SingleReader = true,
      });

  public ChannelReader<EmailJob> Reader => channel.Reader;

  public bool TryEnqueue(EmailJob job) => channel.Writer.TryWrite(job);
}

/// <summary>
/// 대기열을 비우는 백그라운드 발송기.
/// 발송 결과는 성공·실패 모두 email_logs에 남긴다 — 알림이 안 갔다는 신고가 들어왔을 때
/// 발송 자체가 없었는지, 보냈는데 실패했는지 구분할 수 있어야 한다. (F-INQ-03 / PRD §5.9)
/// </summary>
public class EmailDispatcher(
    EmailQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<EmailDispatcher> logger) : BackgroundService
{
  protected override async Task ExecuteAsync(CancellationToken stoppingToken)
  {
    await foreach (var job in queue.Reader.ReadAllAsync(stoppingToken))
    {
      // 발송기·DbContext는 작업마다 스코프에서 꺼낸다(DbContext는 스코프 수명이라 캐시하면 안 된다)
      using var scope = scopeFactory.CreateScope();
      var status = EmailStatus.Sent;

      try
      {
        var sender = scope.ServiceProvider.GetRequiredService<IAppEmailSender>();
        await sender.SendAsync(new EmailMessage(job.Recipient, job.Subject, job.Body), stoppingToken);
      }
      catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
      {
        throw;   // 종료 중 — 정상 경로
      }
      catch (Exception ex)
      {
        status = EmailStatus.Failed;
        logger.LogError(ex, "이메일 발송 실패: {Type} → {Recipient}", job.Type, job.Recipient);
      }

      await RecordAsync(scope.ServiceProvider, job, status, stoppingToken);
    }
  }

  /// <summary>발송 결과 기록. 기록 실패가 발송 루프를 멈추게 두지 않는다.</summary>
  private async Task RecordAsync(
      IServiceProvider services, EmailJob job, EmailStatus status, CancellationToken cancellationToken)
  {
    try
    {
      var db = services.GetRequiredService<ApplicationDbContext>();
      db.EmailLogs.Add(new EmailLog
      {
        Type = job.Type,
        Recipient = job.Recipient,
        Subject = job.Subject,
        Status = status,
        RelatedInquiryId = job.RelatedInquiryId,
      });
      await db.SaveChangesAsync(cancellationToken);
    }
    catch (Exception ex)
    {
      logger.LogError(ex, "이메일 발송 로그 기록 실패: {Type} → {Recipient}", job.Type, job.Recipient);
    }
  }
}
