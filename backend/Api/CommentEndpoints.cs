using System.Security.Claims;
using backend.Data;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Api;

/// <summary>댓글 작성 요청 (E-03)</summary>
public record CreateCommentRequest(string Body);

/// <summary>댓글 수정 요청 (E-03)</summary>
public record UpdateCommentRequest(string Body);

/// <summary>댓글 항목 — canDelete는 작성자 본인/관리자 여부</summary>
public record CommentItem(
    int Id,
    string Body,
    string AuthorName,
    bool CanDelete,
    DateTimeOffset CreatedAt);

public static class CommentEndpoints
{
  public static IEndpointRouteBuilder MapCommentEndpoints(this IEndpointRouteBuilder app)
  {
    // 로그인(인증) 필요
    var board = app.MapGroup("/api").RequireAuthorization();

    // 댓글 목록 (작성순)
    board.MapGet("/posts/{postId:int}/comments", async (
        int postId,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      var userId = userManager.GetUserId(user);
      var isAdmin = user.IsInRole(DbSeeder.AdminRole);

      var items = await db.Comments
          .Where(c => c.PostId == postId && !c.IsDeleted)
          .OrderBy(c => c.CreatedAt)
          .Select(c => new CommentItem(
              c.Id, c.Body, c.Author!.Name,
              c.AuthorId == userId || isAdmin, c.CreatedAt))
          .ToListAsync();

      return Results.Ok(items);
    });

    // 댓글 작성
    board.MapPost("/posts/{postId:int}/comments", async (
        int postId,
        CreateCommentRequest req,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      if (string.IsNullOrWhiteSpace(req.Body))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["body"] = ["댓글 내용을 입력하세요."],
        });
      }

      var postExists = await db.Posts.AnyAsync(p => p.Id == postId && !p.IsDeleted);
      if (!postExists)
      {
        return Results.NotFound();
      }

      var authorId = userManager.GetUserId(user)!;
      var comment = new Comment
      {
        PostId = postId,
        AuthorId = authorId,
        Body = req.Body,
      };

      db.Comments.Add(comment);
      await db.SaveChangesAsync();

      return Results.Created($"/api/comments/{comment.Id}", new { comment.Id });
    });

    // 댓글 수정 — 작성자 본인 또는 관리자만
    board.MapPut("/comments/{id:int}", async (
        int id,
        UpdateCommentRequest req,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      if (string.IsNullOrWhiteSpace(req.Body))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["body"] = ["댓글 내용을 입력하세요."],
        });
      }

      var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
      if (comment is null)
      {
        return Results.NotFound();
      }

      var userId = userManager.GetUserId(user);
      if (comment.AuthorId != userId && !user.IsInRole(DbSeeder.AdminRole))
      {
        return Results.Forbid();
      }

      comment.Body = req.Body;
      comment.UpdatedAt = DateTimeOffset.UtcNow;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    // 댓글 삭제 (소프트) — 작성자 본인 또는 관리자만
    board.MapDelete("/comments/{id:int}", async (
        int id,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      var comment = await db.Comments.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
      if (comment is null)
      {
        return Results.NotFound();
      }

      var userId = userManager.GetUserId(user);
      if (comment.AuthorId != userId && !user.IsInRole(DbSeeder.AdminRole))
      {
        return Results.Forbid();
      }

      comment.IsDeleted = true;
      comment.UpdatedAt = DateTimeOffset.UtcNow;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    return app;
  }
}
