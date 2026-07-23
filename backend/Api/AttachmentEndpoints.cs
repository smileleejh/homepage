using System.Security.Claims;
using backend.Data;
using backend.Domain;
using backend.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend.Api;

/// <summary>첨부파일 항목 (E-03/E-04)</summary>
public record AttachmentItem(
    int Id,
    string OriginalName,
    long SizeBytes,
    string MimeType,
    bool CanDelete);

/// <summary>
/// 첨부 업로드 제한 (E-04 폼 안내용).
/// 화면에 하드코딩하면 서버 설정과 어긋나므로 실제 적용값을 그대로 내려준다.
/// </summary>
public record UploadPolicy(
    long MaxFileSizeBytes,
    int MaxFilesPerPost,
    IReadOnlyList<string> AllowedExtensions);

public static class AttachmentEndpoints
{
  // 개발용 로컬 디스크 저장 폴더명(컨텐츠 루트 하위). 운영은 오브젝트 스토리지로 교체.
  private const string UploadDirName = "uploads";

  public static IEndpointRouteBuilder MapAttachmentEndpoints(this IEndpointRouteBuilder app)
  {
    var board = app.MapGroup("/api").RequireAuthorization();

    // 업로드 제한 조회 — 글쓰기 폼의 accept·용량 안내에 사용 (F-BRD-04)
    board.MapGet("/attachments/policy", (IOptions<UploadOptions> uploadOptions) =>
        Results.Ok(new UploadPolicy(
            uploadOptions.Value.MaxFileSizeBytes,
            uploadOptions.Value.MaxFilesPerPost,
            AttachmentTypes.AllowedExtensions)));

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
        IWebHostEnvironment env,
        IOptions<UploadOptions> uploadOptions,
        ILoggerFactory loggerFactory) =>
    {
      var options = uploadOptions.Value;
      var logger = loggerFactory.CreateLogger("AttachmentEndpoints");

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

      // 개수 제한 — 이미 붙어 있는 첨부까지 합산한다
      var existingCount = await db.Attachments.CountAsync(a => a.PostId == postId);
      if (existingCount + files.Count > options.MaxFilesPerPost)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["files"] = [$"첨부는 게시글당 최대 {options.MaxFilesPerPost}개입니다. " +
                       $"(현재 {existingCount}개, 추가 시도 {files.Count}개)"],
        });
      }

      // 형식·용량 검증을 먼저 전부 끝낸다 — 일부만 저장되고 나머지가 실패하는 상태를 만들지 않는다
      var errors = files
          .Select(file => AttachmentTypes.Validate(file, options))
          .Where(error => error is not null)
          .Select(error => error!)
          .ToArray();
      if (errors.Length > 0)
      {
        logger.LogWarning("첨부 업로드 거부 — 게시글 {PostId}: {Errors}", postId, string.Join(" / ", errors));
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["files"] = errors,
        });
      }

      var uploadDir = Path.Combine(env.ContentRootPath, UploadDirName);
      Directory.CreateDirectory(uploadDir);

      var count = 0;
      foreach (var file in files)
      {
        var originalName = Path.GetFileName(file.FileName);

        // 저장 파일명은 서버가 새로 만든다 — 원본 이름을 그대로 쓰면 경로 조작·덮어쓰기에 노출된다.
        // 확장자는 화이트리스트를 통과한 값이므로 그대로 붙여도 안전하다.
        var extension = Path.GetExtension(originalName).ToLowerInvariant();
        var storedName = $"{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(uploadDir, storedName);
        await using (var stream = File.Create(fullPath))
        {
          await file.CopyToAsync(stream);
        }

        db.Attachments.Add(new Attachment
        {
          PostId = postId,
          OriginalName = originalName,
          StoredPath = storedName,   // uploads/ 기준 상대 key
          // 클라이언트가 보낸 Content-Type이 아니라 확장자에서 유도한 MIME을 저장한다
          MimeType = AttachmentTypes.ResolveMimeType(originalName)!,
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
        ClaimsPrincipal user,
        IWebHostEnvironment env,
        HttpContext http) =>
    {
      var attachment = await db.Attachments
          .Include(a => a.Post)
          .FirstOrDefaultAsync(a => a.Id == id);
      if (attachment is null)
      {
        return Results.NotFound();
      }

      // 삭제된 게시글의 첨부는 관리자만 받을 수 있다 — 글이 안 보이는데 첨부만 열리면 안 된다
      if (attachment.Post is { IsDeleted: true } && !user.IsInRole(DbSeeder.AdminRole))
      {
        return Results.NotFound();
      }

      var fullPath = Path.Combine(env.ContentRootPath, UploadDirName, attachment.StoredPath);
      if (!File.Exists(fullPath))
      {
        return Results.NotFound();
      }

      // 브라우저가 MIME을 추측해 내용을 해석하지 못하게 막는다(저장된 MIME + 첨부 다운로드 강제)
      http.Response.Headers.XContentTypeOptions = "nosniff";

      // 전체를 메모리에 올리지 않고 스트림으로 흘려보낸다
      var stream = File.OpenRead(fullPath);
      return Results.File(stream, attachment.MimeType, attachment.OriginalName);
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
