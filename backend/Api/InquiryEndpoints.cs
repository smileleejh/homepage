using backend.Data;
using backend.Domain;
using backend.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend.Api;

/// <summary>
/// 문의 제출 요청 (P-05 문의 폼).
/// Website는 허니팟 — 화면에서 숨겨져 사람은 채울 수 없고, 폼을 기계적으로 채우는 봇만 값을 넣는다.
/// </summary>
public record CreateInquiryRequest(
    string Name,
    string Email,
    string? Company,
    string? Phone,
    string? Category,
    string Title,
    string Message,
    bool PrivacyConsent,
    string? Website = null);

/// <summary>관리자 문의 목록 항목 (A-02)</summary>
public record InquiryListItem(
    int Id,
    string Name,
    string Email,
    string Title,
    string Status,
    string? AssignedAdminName,
    DateTimeOffset CreatedAt);

/// <summary>관리자 문의 상세 (A-03)</summary>
public record InquiryDetail(
    int Id,
    string Name,
    string Email,
    string? Company,
    string? Phone,
    string? Category,
    string Title,
    string Message,
    string Status,
    string? AssignedAdminId,
    string? AssignedAdminName,
    string? AdminMemo,
    bool PrivacyConsent,
    string? CreatedIp,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

/// <summary>
/// 문의 상태·담당자·메모 변경 요청 (A-03 / F-INQ-05).
/// 각 필드는 null이면 "변경 안 함"으로 간주하는 부분 수정(PATCH) 의미를 가진다.
/// AssignedAdminId·AdminMemo에 빈 문자열("")을 보내면 해당 값을 비운다(담당자 해제/메모 삭제).
/// </summary>
public record UpdateInquiryRequest(string? Status, string? AssignedAdminId, string? AdminMemo);

public static class InquiryEndpoints
{
  /// <summary>공개 문의 제출에 적용할 Rate Limit 정책명 — 등록은 Program.cs에서 한다. (F-INQ-01)</summary>
  public const string RateLimitPolicy = "inquiry";

  /// <summary>IP당 허용 제출 건수 — 정상 이용자가 걸리지 않을 만큼 넉넉하게 둔다.</summary>
  public const int RateLimitPermitLimit = 5;

  /// <summary>허용 건수를 세는 창 길이.</summary>
  public static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(10);

  public static IEndpointRouteBuilder MapInquiryEndpoints(this IEndpointRouteBuilder app)
  {
    // 공개: 문의 제출 (F-INQ-01/02)
    app.MapPost("/api/inquiries", async (
        CreateInquiryRequest req,
        ApplicationDbContext db,
        HttpContext http,
        ILoggerFactory loggerFactory,
        IEmailQueue emailQueue,
        IOptions<EmailOptions> emailOptions) =>
    {
      // 허니팟 — 숨김 필드가 채워져 있으면 봇으로 간주한다.
      // 저장하지 않되 정상 접수와 같은 응답을 돌려준다. 거절을 알려주면 어느 필드가 덫인지
      // 학습해 우회하므로, 봇 입장에서는 성공한 것처럼 보이게 두는 편이 낫다.
      if (!string.IsNullOrWhiteSpace(req.Website))
      {
        loggerFactory.CreateLogger("InquiryEndpoints").LogWarning(
            "문의 허니팟 감지 — 저장하지 않음: {Ip}", http.Connection.RemoteIpAddress);
        return Results.Created("/api/inquiries", new { Id = 0 });
      }

      if (string.IsNullOrWhiteSpace(req.Name) ||
              string.IsNullOrWhiteSpace(req.Email) ||
              string.IsNullOrWhiteSpace(req.Title) ||
              string.IsNullOrWhiteSpace(req.Message))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["required"] = ["이름·이메일·제목·내용은 필수입니다."],
        });
      }

      if (!req.PrivacyConsent)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["privacyConsent"] = ["개인정보 수집·이용 동의가 필요합니다."],
        });
      }

      var inquiry = new Inquiry
      {
        Name = req.Name,
        Email = req.Email,
        Company = req.Company,
        Phone = req.Phone,
        Category = req.Category,
        Title = req.Title,
        Message = req.Message,
        PrivacyConsent = req.PrivacyConsent,
        CreatedIp = http.Connection.RemoteIpAddress?.ToString(),
        Status = InquiryStatus.Received,
      };

      db.Inquiries.Add(inquiry);
      await db.SaveChangesAsync();

      // 담당자 알림 (F-INQ-03) — 큐에 넣기만 하고 응답한다.
      // 발송 결과(email_logs 기록 포함)는 EmailDispatcher가 백그라운드에서 처리하므로
      // 메일 서버가 느리거나 죽어 있어도 접수 자체는 성공한다.
      QueueNotifications(inquiry, emailQueue, emailOptions.Value,
          loggerFactory.CreateLogger("InquiryEndpoints"));

      return Results.Created($"/api/inquiries/{inquiry.Id}", new { inquiry.Id });
    }).RequireRateLimiting(RateLimitPolicy);

    // 관리자 문의 관리 그룹 (A-02/A-03) — admin 역할만
    var admin = app.MapGroup("/api/admin/inquiries")
        .RequireAuthorization(policy => policy.RequireRole(DbSeeder.AdminRole));

    // 목록/검색 (F-INQ-04) — 상태·기간·키워드 필터
    admin.MapGet("/", async (
        string? status, string? q, DateTimeOffset? from, DateTimeOffset? to,
        ApplicationDbContext db) =>
    {
      var query = db.Inquiries.AsQueryable();

      // 상태 필터
      if (!string.IsNullOrWhiteSpace(status) &&
          Enum.TryParse<InquiryStatus>(status, true, out var st) && Enum.IsDefined(st))
      {
        query = query.Where(i => i.Status == st);
      }

      // 기간 필터 (접수일 기준)
      if (from is not null)
      {
        query = query.Where(i => i.CreatedAt >= from.Value);
      }
      if (to is not null)
      {
        query = query.Where(i => i.CreatedAt <= to.Value);
      }

      // 키워드(이름·이메일·제목·내용) — 대소문자 무시
      if (!string.IsNullOrWhiteSpace(q))
      {
        var term = q.Trim().ToLower();
        query = query.Where(i =>
            i.Name.ToLower().Contains(term) ||
            i.Email.ToLower().Contains(term) ||
            i.Title.ToLower().Contains(term) ||
            i.Message.ToLower().Contains(term));
      }

      var items = await query
          .OrderByDescending(i => i.CreatedAt)
          .Select(i => new InquiryListItem(
              i.Id, i.Name, i.Email, i.Title, i.Status.ToString(),
              i.AssignedAdmin != null ? i.AssignedAdmin.Name : null, i.CreatedAt))
          .ToListAsync();

      return Results.Ok(items);
    });

    // 상세 (A-03)
    admin.MapGet("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
      var inquiry = await db.Inquiries
          .Include(i => i.AssignedAdmin)
          .FirstOrDefaultAsync(i => i.Id == id);
      if (inquiry is null)
      {
        return Results.NotFound();
      }

      return Results.Ok(new InquiryDetail(
          inquiry.Id, inquiry.Name, inquiry.Email, inquiry.Company, inquiry.Phone,
          inquiry.Category, inquiry.Title, inquiry.Message, inquiry.Status.ToString(),
          inquiry.AssignedAdminId, inquiry.AssignedAdmin?.Name, inquiry.AdminMemo,
          inquiry.PrivacyConsent, inquiry.CreatedIp, inquiry.CreatedAt, inquiry.UpdatedAt));
    });

    // 상태/담당자/메모 변경 (F-INQ-05)
    admin.MapPatch("/{id:int}", async (
        int id,
        UpdateInquiryRequest req,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager) =>
    {
      var inquiry = await db.Inquiries.FirstOrDefaultAsync(i => i.Id == id);
      if (inquiry is null)
      {
        return Results.NotFound();
      }

      // 상태 전환 (received → in_progress → done)
      if (!string.IsNullOrWhiteSpace(req.Status))
      {
        if (!Enum.TryParse<InquiryStatus>(req.Status, true, out var st) || !Enum.IsDefined(st))
        {
          return Results.ValidationProblem(new Dictionary<string, string[]>
          {
            ["status"] = ["유효한 문의 상태가 아닙니다. (Received / InProgress / Done)"],
          });
        }
        inquiry.Status = st;
      }

      // 담당자 지정/해제 — 빈 문자열이면 해제, 값이 있으면 admin 역할 사용자만 허용
      if (req.AssignedAdminId is not null)
      {
        if (req.AssignedAdminId.Length == 0)
        {
          inquiry.AssignedAdminId = null;
        }
        else
        {
          var assignee = await userManager.FindByIdAsync(req.AssignedAdminId);
          if (assignee is null || !await userManager.IsInRoleAsync(assignee, DbSeeder.AdminRole))
          {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
              ["assignedAdminId"] = ["담당자는 관리자 계정만 지정할 수 있습니다."],
            });
          }
          inquiry.AssignedAdminId = assignee.Id;
        }
      }

      // 내부 메모 — 빈 문자열이면 삭제
      if (req.AdminMemo is not null)
      {
        inquiry.AdminMemo = string.IsNullOrWhiteSpace(req.AdminMemo) ? null : req.AdminMemo;
      }

      inquiry.UpdatedAt = DateTimeOffset.UtcNow;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    return app;
  }

  /// <summary>
  /// 신규 문의 알림을 담당자 수만큼 대기열에 넣는다 (F-INQ-03).
  /// 알림 실패가 접수 실패로 이어지면 안 되므로 여기서는 예외를 던지지 않고 로그만 남긴다.
  /// </summary>
  private static void QueueNotifications(
      Inquiry inquiry, IEmailQueue queue, EmailOptions options, ILogger logger)
  {
    var recipients = options.InquiryRecipients
        .Where(address => !string.IsNullOrWhiteSpace(address))
        .ToArray();
    if (recipients.Length == 0)
    {
      logger.LogWarning(
          "Email:InquiryRecipients 미설정 — 문의 {InquiryId} 담당자 알림을 보내지 않습니다.", inquiry.Id);
      return;
    }

    var subject = $"[문의 접수 #{inquiry.Id}] {inquiry.Title}";
    var body = BuildNotificationBody(inquiry, options.AdminBaseUrl);

    foreach (var recipient in recipients)
    {
      if (!queue.TryEnqueue(new EmailJob(
              EmailType.InquiryNotify, recipient, subject, body, inquiry.Id)))
      {
        // 대기열이 가득 찼다 — 발송 자체가 없었으므로 email_logs에도 남지 않는다
        logger.LogError(
            "이메일 대기열 포화 — 문의 {InquiryId} 알림을 {Recipient}에게 보내지 못했습니다.",
            inquiry.Id, recipient);
      }
    }
  }

  /// <summary>담당자 알림 메일 본문. 상세 확인 링크는 관리자 화면 주소가 설정된 경우에만 넣는다.</summary>
  private static string BuildNotificationBody(Inquiry inquiry, string adminBaseUrl)
  {
    var lines = new List<string>
    {
      "새 문의가 접수되었습니다.",
      "",
      $"접수번호: #{inquiry.Id}",
      $"접수일시: {inquiry.CreatedAt.ToLocalTime():yyyy-MM-dd HH:mm}",
      $"이름: {inquiry.Name}",
      $"이메일: {inquiry.Email}",
      $"회사: {inquiry.Company ?? "-"}",
      $"연락처: {inquiry.Phone ?? "-"}",
      $"분류: {inquiry.Category ?? "-"}",
      $"제목: {inquiry.Title}",
      "",
      "내용:",
      inquiry.Message,
    };

    if (!string.IsNullOrWhiteSpace(adminBaseUrl))
    {
      lines.Add("");
      lines.Add($"상세 확인: {adminBaseUrl.TrimEnd('/')}/admin/inquiries/{inquiry.Id}");
    }

    return string.Join(Environment.NewLine, lines);
  }
}
