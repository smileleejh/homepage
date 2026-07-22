using System.Security.Claims;
using backend.Data;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Api;

/// <summary>첨부파일 항목 (E-03/E-04)</summary>
public record AttachmentItem(
    int Id,
    string OriginalName,
    long SizeBytes,
    string MimeType,
    bool CanDelete);

public static class AttachmentEndpoints
{
  // 개발용 로컬 디스크 저장 폴더명(컨텐츠 루트 하위). 운영은 오브젝트 스토리지로 교체.
  private const string UploadDirName = "uploads";

  public static IEndpointRouteBuilder MapAttachmentEndpoints(this IEndpointRouteBuilder app)
  {
    var board = app.MapGroup("/api").RequireAuthorization();

    // 첨부 목록
    board.MapGet("/posts/{postId:int}/attachments", async (
        int postId,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user) =>
    {
      var userId = userManager.GetUserId(user);
      var isAdmin = user.IsInRole(DbSeeder.AdminRole);

      var items = await db.Attachments
          .Where(a => a.PostId == postId)
          .OrderBy(a => a.Id)
          .Select(a => new AttachmentItem(
              a.Id, a.OriginalName, a.SizeBytes, a.MimeType,
              a.UploadedById == userId || isAdmin))
          .ToListAsync();

      return Results.Ok(items);
    });

    // 업로드 (multipart) — 게시글 작성자 본인 또는 관리자만
    board.MapPost("/posts/{postId:int}/attachments", async (
        int postId,
        IFormFileCollection files,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user,
        IWebHostEnvironment env) =>
    {
      var post = await db.Posts.FirstOrDefaultAsync(p => p.Id == postId && !p.IsDeleted);
      if (post is null)
      {
        return Results.NotFound();
      }

      var userId = userManager.GetUserId(user)!;
      if (post.AuthorId != userId && !user.IsInRole(DbSeeder.AdminRole))
      {
        return Results.Forbid();
      }

      if (files is null || files.Count == 0)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["files"] = ["첨부할 파일이 없습니다."],
        });
      }

      var uploadDir = Path.Combine(env.ContentRootPath, UploadDirName);
      Directory.CreateDirectory(uploadDir);

      var count = 0;
      foreach (var file in files)
      {
        if (file.Length == 0) continue;

        var storedName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
        var fullPath = Path.Combine(uploadDir, storedName);
        await using (var stream = File.Create(fullPath))
        {
          await file.CopyToAsync(stream);
        }

        db.Attachments.Add(new Attachment
        {
          PostId = postId,
          OriginalName = Path.GetFileName(file.FileName),
          StoredPath = storedName,   // uploads/ 기준 상대 key
          MimeType = string.IsNullOrWhiteSpace(file.ContentType)
              ? "application/octet-stream"
              : file.ContentType,
          SizeBytes = file.Length,
          UploadedById = userId,
        });
        count++;
      }

      await db.SaveChangesAsync();
      return Results.Ok(new { count });
    }).DisableAntiforgery();

    // 다운로드
    board.MapGet("/attachments/{id:int}", async (
        int id,
        ApplicationDbContext db,
        IWebHostEnvironment env) =>
    {
      var attachment = await db.Attachments.FirstOrDefaultAsync(a => a.Id == id);
      if (attachment is null)
      {
        return Results.NotFound();
      }

      var fullPath = Path.Combine(env.ContentRootPath, UploadDirName, attachment.StoredPath);
      if (!File.Exists(fullPath))
      {
        return Results.NotFound();
      }

      var bytes = await File.ReadAllBytesAsync(fullPath);
      return Results.File(bytes, attachment.MimeType, attachment.OriginalName);
    });

    // 삭제 — 업로더 본인 또는 관리자
    board.MapDelete("/attachments/{id:int}", async (
        int id,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal user,
        IWebHostEnvironment env) =>
    {
      var attachment = await db.Attachments.FirstOrDefaultAsync(a => a.Id == id);
      if (attachment is null)
      {
        return Results.NotFound();
      }

      var userId = userManager.GetUserId(user);
      if (attachment.UploadedById != userId && !user.IsInRole(DbSeeder.AdminRole))
      {
        return Results.Forbid();
      }

      var fullPath = Path.Combine(env.ContentRootPath, UploadDirName, attachment.StoredPath);
      db.Attachments.Remove(attachment);
      await db.SaveChangesAsync();

      try
      {
        if (File.Exists(fullPath)) File.Delete(fullPath);
      }
      catch
      {
        // 파일 삭제 실패는 무시(레코드는 이미 제거)
      }

      return Results.NoContent();
    });

    return app;
  }
}
