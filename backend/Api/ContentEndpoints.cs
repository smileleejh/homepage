using backend.Data;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Api;

/// <summary>공개 CMS 콘텐츠 (P-01/P-02 편집 영역 표시용)</summary>
public record PageContentDto(string Key, string? Title, string Body, bool IsVisible, DateTimeOffset UpdatedAt);

/// <summary>관리자 콘텐츠 목록 항목 (A-07)</summary>
public record AdminContentItem(string Key, string? Title, bool IsVisible, DateTimeOffset UpdatedAt, string? UpdatedByName);

/// <summary>관리자 콘텐츠 상세 (A-07 편집 로드)</summary>
public record AdminContentDetail(string Key, string? Title, string Body, bool IsVisible, DateTimeOffset UpdatedAt, string? UpdatedByName);

/// <summary>콘텐츠 편집 요청 (A-07)</summary>
public record UpdateContentRequest(string? Title, string Body, bool IsVisible);

public static class ContentEndpoints
{
  public static IEndpointRouteBuilder MapContentEndpoints(this IEndpointRouteBuilder app)
  {
    // 공개: 편집 콘텐츠 조회 (CMS 읽기) — 화이트리스트 키만 허용
    app.MapGet("/api/content/{key}", async (string key, ApplicationDbContext db) =>
    {
      if (!PageContentKeys.IsAllowed(key))
      {
        return Results.NotFound();
      }

      var dto = await db.PageContents
          .Where(p => p.Key == key)
          .Select(p => new PageContentDto(p.Key, p.Title, p.Body, p.IsVisible, p.UpdatedAt))
          .FirstOrDefaultAsync();

      return dto is null ? Results.NotFound() : Results.Ok(dto);
    });

    // 관리자 콘텐츠 편집 그룹 (A-07) — admin 역할만
    var admin = app.MapGroup("/api/admin/content")
        .RequireAuthorization(policy => policy.RequireRole(DbSeeder.AdminRole));

    // 편집 가능한 콘텐츠 목록 — 화이트리스트 순서로 정렬
    admin.MapGet("/", async (ApplicationDbContext db) =>
    {
      var rows = await db.PageContents
          .Select(p => new AdminContentItem(
              p.Key, p.Title, p.IsVisible, p.UpdatedAt,
              p.UpdatedBy != null ? p.UpdatedBy.Name : null))
          .ToListAsync();

      // 화이트리스트 정의 순서대로 노출(정의에 없는 키는 뒤로)
      var order = PageContentKeys.All
          .Select((d, i) => (d.Key, i))
          .ToDictionary(x => x.Key, x => x.i);
      var ordered = rows
          .OrderBy(r => order.TryGetValue(r.Key, out var idx) ? idx : int.MaxValue)
          .ToList();

      return Results.Ok(ordered);
    });

    // 단일 콘텐츠 조회 (편집 화면 로드)
    admin.MapGet("/{key}", async (string key, ApplicationDbContext db) =>
    {
      if (!PageContentKeys.IsAllowed(key))
      {
        return Results.NotFound();
      }

      var dto = await db.PageContents
          .Where(p => p.Key == key)
          .Select(p => new AdminContentDetail(
              p.Key, p.Title, p.Body, p.IsVisible, p.UpdatedAt,
              p.UpdatedBy != null ? p.UpdatedBy.Name : null))
          .FirstOrDefaultAsync();

      return dto is null ? Results.NotFound() : Results.Ok(dto);
    });

    // 콘텐츠 수정(upsert) — 화이트리스트 키만, 없으면 생성
    admin.MapPut("/{key}", async (
        string key,
        UpdateContentRequest req,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      if (!PageContentKeys.IsAllowed(key))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["key"] = ["편집할 수 없는 콘텐츠 키입니다."],
        });
      }

      if (string.IsNullOrWhiteSpace(req.Body))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["body"] = ["본문은 필수입니다."],
        });
      }

      var content = await db.PageContents.FirstOrDefaultAsync(p => p.Key == key);
      if (content is null)
      {
        content = new PageContent { Key = key };
        db.PageContents.Add(content);
      }

      content.Title = req.Title;
      content.Body = req.Body;
      content.IsVisible = req.IsVisible;
      content.UpdatedById = userManager.GetUserId(user);
      content.UpdatedAt = DateTimeOffset.UtcNow;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    return app;
  }
}
