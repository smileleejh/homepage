using backend.Data;
using backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace backend.Api;

/// <summary>문의 제출 요청 (P-05 문의 폼)</summary>
public record CreateInquiryRequest(
    string Name,
    string Email,
    string? Company,
    string? Phone,
    string? Category,
    string Title,
    string Message,
    bool PrivacyConsent);

/// <summary>관리자 문의 목록 항목</summary>
public record InquiryListItem(
    int Id,
    string Name,
    string Email,
    string Title,
    string Status,
    DateTimeOffset CreatedAt);

public static class InquiryEndpoints
{
  public static IEndpointRouteBuilder MapInquiryEndpoints(this IEndpointRouteBuilder app)
  {
    // 공개: 문의 제출 (F-INQ-01/02)
    app.MapPost("/api/inquiries", async (
        CreateInquiryRequest req,
        ApplicationDbContext db,
        HttpContext http) =>
    {
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

      // TODO(M2): 담당자 이메일 알림(F-INQ-03), email_logs 기록
      return Results.Created($"/api/inquiries/{inquiry.Id}", new { inquiry.Id });
    });

    // 관리자: 문의 목록 (F-INQ-04) — admin 역할만
    app.MapGet("/api/admin/inquiries", async (ApplicationDbContext db) =>
    {
      var items = await db.Inquiries
              .OrderByDescending(i => i.CreatedAt)
              .Select(i => new InquiryListItem(
                  i.Id, i.Name, i.Email, i.Title, i.Status.ToString(), i.CreatedAt))
              .ToListAsync();

      return Results.Ok(items);
    })
    .RequireAuthorization(policy => policy.RequireRole(DbSeeder.AdminRole));

    return app;
  }
}
