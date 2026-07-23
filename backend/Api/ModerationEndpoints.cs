using backend.Data;
using backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace backend.Api;

/// <summary>관리자 게시글 모더레이션 항목 (A-06) — 삭제 상태·댓글 수 포함</summary>
public record AdminPostItem(
    int Id,
    string CategorySlug,
    string CategoryName,
    string Title,
    string AuthorName,
    bool IsPinned,
    bool IsDeleted,
    int ViewCount,
    int CommentCount,
    DateTimeOffset CreatedAt);

/// <summary>게시글 모더레이션 목록 페이지네이션 결과 (A-06)</summary>
public record AdminPagedPosts(
    IReadOnlyList<AdminPostItem> Items,
    int Total,
    int Page,
    int PageSize);

/// <summary>관리자 댓글 모더레이션 항목 (A-06) — 소속 게시글·삭제 상태 포함</summary>
public record AdminCommentItem(
    int Id,
    int PostId,
    string PostTitle,
    string Body,
    string AuthorName,
    bool IsDeleted,
    DateTimeOffset CreatedAt);

/// <summary>댓글 모더레이션 목록 페이지네이션 결과 (A-06)</summary>
public record AdminPagedComments(
    IReadOnlyList<AdminCommentItem> Items,
    int Total,
    int Page,
    int PageSize);

public static class ModerationEndpoints
{
  public static IEndpointRouteBuilder MapModerationEndpoints(this IEndpointRouteBuilder app)
  {
    // 게시판 모더레이션 그룹 (A-06) — admin 역할만
    var admin = app.MapGroup("/api/admin")
        .RequireAuthorization(policy => policy.RequireRole(DbSeeder.AdminRole));

    // 게시글 목록 — 카테고리·키워드 필터, 기본은 미삭제만(includeDeleted=true면 삭제글 포함)
    admin.MapGet("/posts", async (
        string? category, string? q, bool? includeDeleted, int? page, int? pageSize,
        ApplicationDbContext db) =>
    {
      var currentPage = page is > 0 ? page.Value : 1;
      var size = pageSize is > 0 and <= 50 ? pageSize.Value : 20;

      var query = db.Posts.AsQueryable();
      if (includeDeleted != true)
      {
        query = query.Where(p => !p.IsDeleted);
      }
      if (!string.IsNullOrWhiteSpace(category))
      {
        query = query.Where(p => p.Category!.Slug == category);
      }
      if (!string.IsNullOrWhiteSpace(q))
      {
        var term = q.Trim().ToLower();
        query = query.Where(p =>
            p.Title.ToLower().Contains(term) || p.Author!.Name.ToLower().Contains(term));
      }

      var total = await query.CountAsync();
      var items = await query
          .OrderByDescending(p => p.CreatedAt)
          .Skip((currentPage - 1) * size)
          .Take(size)
          .Select(p => new AdminPostItem(
              p.Id, p.Category!.Slug, p.Category!.Name, p.Title, p.Author!.Name,
              p.IsPinned, p.IsDeleted, p.ViewCount,
              p.Comments.Count(c => !c.IsDeleted), p.CreatedAt))
          .ToListAsync();

      return Results.Ok(new AdminPagedPosts(items, total, currentPage, size));
    });

    // 게시글 삭제 (모더레이션·소프트 삭제) — 이미 삭제됐으면 멱등 처리
    admin.MapDelete("/posts/{id:int}", async (int id, ApplicationDbContext db) =>
    {
      var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id);
      if (post is null)
      {
        return Results.NotFound();
      }

      if (!post.IsDeleted)
      {
        post.IsDeleted = true;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
      }

      return Results.NoContent();
    });

    // 게시글 복구 (소프트 삭제 취소)
    admin.MapPost("/posts/{id:int}/restore", async (int id, ApplicationDbContext db) =>
    {
      var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id);
      if (post is null)
      {
        return Results.NotFound();
      }

      if (post.IsDeleted)
      {
        post.IsDeleted = false;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
      }

      return Results.NoContent();
    });

    // 공지 고정/해제 (F-BRD-05) — 게시판 홈 상단 노출
    admin.MapPatch("/posts/{id:int}/pin", async (int id, PinRequest req, ApplicationDbContext db) =>
    {
      var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
      if (post is null)
      {
        return Results.NotFound();
      }

      post.IsPinned = req.Pinned;
      post.UpdatedAt = DateTimeOffset.UtcNow;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    // 댓글 목록 — 키워드·게시글 필터, 기본은 미삭제만(includeDeleted=true면 삭제 포함)
    admin.MapGet("/comments", async (
        string? q, int? postId, bool? includeDeleted, int? page, int? pageSize,
        ApplicationDbContext db) =>
    {
      var currentPage = page is > 0 ? page.Value : 1;
      var size = pageSize is > 0 and <= 50 ? pageSize.Value : 20;

      var query = db.Comments.AsQueryable();
      if (includeDeleted != true)
      {
        query = query.Where(c => !c.IsDeleted);
      }
      if (postId is > 0)
      {
        query = query.Where(c => c.PostId == postId.Value);
      }
      if (!string.IsNullOrWhiteSpace(q))
      {
        var term = q.Trim().ToLower();
        query = query.Where(c =>
            c.Body.ToLower().Contains(term) || c.Author!.Name.ToLower().Contains(term));
      }

      var total = await query.CountAsync();
      var items = await query
          .OrderByDescending(c => c.CreatedAt)
          .Skip((currentPage - 1) * size)
          .Take(size)
          .Select(c => new AdminCommentItem(
              c.Id, c.PostId, c.Post!.Title, c.Body, c.Author!.Name, c.IsDeleted, c.CreatedAt))
          .ToListAsync();

      return Results.Ok(new AdminPagedComments(items, total, currentPage, size));
    });

    // 댓글 삭제 (모더레이션·소프트 삭제)
    admin.MapDelete("/comments/{id:int}", async (int id, ApplicationDbContext db) =>
    {
      var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == id);
      if (comment is null)
      {
        return Results.NotFound();
      }

      if (!comment.IsDeleted)
      {
        comment.IsDeleted = true;
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
      }

      return Results.NoContent();
    });

    // 댓글 복구 (소프트 삭제 취소)
    admin.MapPost("/comments/{id:int}/restore", async (int id, ApplicationDbContext db) =>
    {
      var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == id);
      if (comment is null)
      {
        return Results.NotFound();
      }

      if (comment.IsDeleted)
      {
        comment.IsDeleted = false;
        comment.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
      }

      return Results.NoContent();
    });

    return app;
  }
}
