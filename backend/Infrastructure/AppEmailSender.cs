namespace backend.Infrastructure;

/// <summary>
/// 애플리케이션 알림 메일 설정 (F-INQ-03). appsettings의 Email 섹션에 대응.
/// </summary>
public class EmailOptions
{
  public const string SectionName = "Email";

  /// <summary>신규 문의 접수 시 알림을 받을 담당자 주소. 비어 있으면 알림을 보내지 않는다.</summary>
  public string[] InquiryRecipients { get; set; } = [];

  /// <summary>메일 본문에 넣을 관리자 화면 주소(예: https://example.com). 비어 있으면 링크를 생략한다.</summary>
  public string AdminBaseUrl { get; set; } = string.Empty;
}

/// <summary>발송할 메일 한 통</summary>
public record EmailMessage(string Recipient, string Subject, string Body);

/// <summary>
/// 애플리케이션이 직접 보내는 알림 메일의 추상화 (DESIGN §4.7).
/// Identity의 인증·재설정 메일은 별도로 <see cref="LoggingEmailSender"/>(IEmailSender&lt;T&gt;)가 담당한다.
/// 운영에서는 이 인터페이스만 SMTP/SendGrid/ACS 구현으로 갈아끼운다.
/// </summary>
public interface IAppEmailSender
{
  Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}

/// <summary>
/// 개발용 발송기 — 실제로 보내지 않고 내용을 로그로 출력한다.
/// 제공자 확정 전까지의 임시 구현이며, 교체 지점은 Program.cs의 DI 등록 한 줄이다.
/// </summary>
public class LoggingAppEmailSender(ILogger<LoggingAppEmailSender> logger) : IAppEmailSender
{
  public Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
  {
    logger.LogInformation(
        "[알림 메일] {Recipient} / {Subject}\n{Body}",
        message.Recipient, message.Subject, message.Body);
    return Task.CompletedTask;
  }
}
