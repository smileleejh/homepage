using System.Security.Claims;
using backend.Data;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Api;

/// <summary>게시글 작성 요청 (E-04)</summary>
public record CreatePostRequest(string CategorySlug, string Title, string Body);

/// <summary>게시글 목록 항목 (E-02)</summary>
public record PostListItem(
    int Id,
    string CategorySlug,
    string Title,
    string AuthorName,
    bool IsPinned,
    int ViewCount,
    DateTimeOffset CreatedAt);

/// <summary>게시글 상세 (E-03)</summary>
public record PostDetail(
    int Id,
    string CategorySlug,
    string CategoryName,
    string Title,
    string Body,
    string AuthorName,
    bool IsPinned,
    int ViewCount,
    DateTimeOffset CreatedAt,
    bool CanDelete);

/// <summary>카테고리 항목 (글쓰기 선택 · GNB 개수 표시용)</summary>
public record CategoryItem(string Slug, string Name, int Count);

/// <summary>게시글 목록 페이지네이션 결과 (E-02)</summary>
public record PagedPosts(
    IReadOnlyList<PostListItem> Items,
    int Total,
    int Page,
    int PageSize);

public static class PostEndpoints
{
  public static IEndpointRouteBuilder MapPostEndpoints(this IEndpointRouteBuilder app)
  {
    // 직원 게시판 — 로그인(인증) 필요. 최종 인가는 여기 [Authorize].
    var board = app.MapGroup("/api").RequireAuthorization();

    // 카테고리 목록 (+ 게시물 수 — GNB/게시판 홈 표시용)
    board.MapGet("/categories", async (ApplicationDbContext db) =>
    {
      var cats = await db.Categories
          .OrderBy(c => c.SortOrder)
          .Select(c => new CategoryItem(
              c.Slug, c.Name, c.Posts.Count(p => !p.IsDeleted)))
          .ToListAsync();
      return Results.Ok(cats);
    });

    // 게시글 목록 (카테고리 slug 선택, 페이지네이션) — 공지 고정 우선, 최신순
    board.MapGet("/posts", async (
        string? category, int? page, int? pageSize, ApplicationDbContext db) =>
    {
      var currentPage = page is > 0 ? page.Value : 1;
      var size = pageSize is > 0 and <= 50 ? pageSize.Value : 10;

      var query = db.Posts.Where(p => !p.IsDeleted);
      if (!string.IsNullOrWhiteSpace(category))
      {
        query = query.Where(p => p.Category!.Slug == category);
      }

      var total = await query.CountAsync();
      var items = await query
          .OrderByDescending(p => p.IsPinned)
          .ThenByDescending(p => p.CreatedAt)
          .Skip((currentPage - 1) * size)
          .Take(size)
          .Select(p => new PostListItem(
              p.Id, p.Category!.Slug, p.Title, p.Author!.Name,
              p.IsPinned, p.ViewCount, p.CreatedAt))
          .ToListAsync();

      return Results.Ok(new PagedPosts(items, total, currentPage, size));
    });

    // 게시글 상세 (조회수 증가). 작성자/관리자면 canDelete=true
    board.MapGet("/posts/{id:int}", async (
        int id,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      var post = await db.Posts
          .Include(p => p.Category)
          .Include(p => p.Author)
          .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
      if (post is null)
      {
        return Results.NotFound();
      }

      post.ViewCount++;
      await db.SaveChangesAsync();

      var userId = userManager.GetUserId(user);
      var canDelete = post.AuthorId == userId || user.IsInRole(DbSeeder.AdminRole);

      return Results.Ok(new PostDetail(
          post.Id, post.Category!.Slug, post.Category!.Name, post.Title, post.Body,
          post.Author!.Name, post.IsPinned, post.ViewCount, post.CreatedAt, canDelete));
    });

    // 게시글 작성 (F-BRD-01)
    board.MapPost("/posts", async (
        CreatePostRequest req,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      if (string.IsNullOrWhiteSpace(req.Title) || string.IsNullOrWhiteSpace(req.Body))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["required"] = ["제목·본문은 필수입니다."],
        });
      }

      var category = await db.Categories
          .FirstOrDefaultAsync(c => c.Slug == req.CategorySlug);
      if (category is null)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["category"] = ["유효한 카테고리를 선택하세요."],
        });
      }

      var authorId = userManager.GetUserId(user)!;
      var post = new Post
      {
        CategoryId = category.Id,
        AuthorId = authorId,
        Title = req.Title,
        Body = req.Body,
      };

      db.Posts.Add(post);
      await db.SaveChangesAsync();

      return Results.Created($"/api/posts/{post.Id}",
          new { post.Id, category = category.Slug });
    });

    // 게시글 삭제 (소프트 삭제) — 작성자 본인 또는 관리자만
    board.MapDelete("/posts/{id:int}", async (
        int id,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
      if (post is null)
      {
        return Results.NotFound();
      }

      var userId = userManager.GetUserId(user);
      var isAdmin = user.IsInRole(DbSeeder.AdminRole);
      if (post.AuthorId != userId && !isAdmin)
      {
        return Results.Forbid();
      }

      post.IsDeleted = true;
      post.UpdatedAt = DateTimeOffset.UtcNow;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    return app;
  }
}
