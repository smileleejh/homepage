using backend.Data;
using backend.Domain;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace backend.Api;

/// <summary>관리자 카테고리 항목 (A-05) — 편집에 필요한 id·정렬순서·게시글 수 포함</summary>
public record AdminCategoryItem(
    int Id,
    string Slug,
    string Name,
    int SortOrder,
    int PostCount,
    DateTimeOffset CreatedAt);

/// <summary>카테고리 생성 요청 (A-05)</summary>
public record CreateCategoryRequest(string Name, string Slug, int SortOrder);

/// <summary>카테고리 수정 요청 (A-05)</summary>
public record UpdateCategoryRequest(string Name, string Slug, int SortOrder);

public static class CategoryEndpoints
{
  public static IEndpointRouteBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
  {
    // 카테고리 관리 그룹 (A-05) — admin 역할만
    var categories = app.MapGroup("/api/admin/categories")
        .RequireAuthorization(policy => policy.RequireRole(DbSeeder.AdminRole));

    // 목록 — 정렬순서대로, 게시글 수 포함
    categories.MapGet("/", async (ApplicationDbContext db) =>
    {
      var items = await db.Categories
          .OrderBy(c => c.SortOrder)
          .Select(c => new AdminCategoryItem(
              c.Id, c.Slug, c.Name, c.SortOrder,
              c.Posts.Count(p => !p.IsDeleted), c.CreatedAt))
          .ToListAsync();

      return Results.Ok(items);
    });

    // 생성 (F-ADM-02)
    categories.MapPost("/", async (CreateCategoryRequest req, ApplicationDbContext db) =>
    {
      var invalid = ValidateCategory(req.Name, req.Slug);
      if (invalid is not null)
      {
        return invalid;
      }

      var slug = req.Slug.Trim().ToLowerInvariant();
      if (await db.Categories.AnyAsync(c => c.Slug == slug))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["slug"] = ["이미 사용 중인 슬러그입니다."],
        });
      }

      var category = new Category
      {
        Name = req.Name.Trim(),
        Slug = slug,
        SortOrder = req.SortOrder,
      };
      db.Categories.Add(category);
      await db.SaveChangesAsync();

      return Results.Created($"/api/admin/categories/{category.Id}",
          new AdminCategoryItem(category.Id, category.Slug, category.Name,
              category.SortOrder, 0, category.CreatedAt));
    });

    // 수정 (F-ADM-02)
    categories.MapPut("/{id:int}", async (int id, UpdateCategoryRequest req, ApplicationDbContext db) =>
    {
      var category = await db.Categories.FindAsync(id);
      if (category is null)
      {
        return Results.NotFound();
      }

      var invalid = ValidateCategory(req.Name, req.Slug);
      if (invalid is not null)
      {
        return invalid;
      }

      var slug = req.Slug.Trim().ToLowerInvariant();
      if (await db.Categories.AnyAsync(c => c.Slug == slug && c.Id != id))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["slug"] = ["이미 사용 중인 슬러그입니다."],
        });
      }

      category.Name = req.Name.Trim();
      category.Slug = slug;
      category.SortOrder = req.SortOrder;
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    // 삭제 (F-ADM-02) — 게시글이 있는 카테고리는 삭제 불가(FK 제약)
    categories.MapDelete("/{id:int}", async (int id, ApplicationDbContext db) =>
    {
      var category = await db.Categories.FindAsync(id);
      if (category is null)
      {
        return Results.NotFound();
      }

      // 소프트 삭제 글도 FK로 카테고리를 참조하므로 전체 게시글 존재 여부로 판단
      if (await db.Posts.AnyAsync(p => p.CategoryId == id))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["category"] = ["게시글이 있는 카테고리는 삭제할 수 없습니다. 먼저 게시글을 이동·삭제하세요."],
        });
      }

      db.Categories.Remove(category);
      await db.SaveChangesAsync();

      return Results.NoContent();
    });

    return app;
  }

  // 이름·슬러그 공통 검증. 문제가 있으면 ValidationProblem, 없으면 null 반환
  private static IResult? ValidateCategory(string? name, string? slug)
  {
    var errors = new Dictionary<string, string[]>();

    if (string.IsNullOrWhiteSpace(name))
    {
      errors["name"] = ["이름은 필수입니다."];
    }

    if (string.IsNullOrWhiteSpace(slug))
    {
      errors["slug"] = ["슬러그는 필수입니다."];
    }
    else if (!Regex.IsMatch(slug.Trim().ToLowerInvariant(), "^[a-z0-9-]+$"))
    {
      errors["slug"] = ["슬러그는 영문 소문자·숫자·하이픈(-)만 사용할 수 있습니다."];
    }

    return errors.Count > 0 ? Results.ValidationProblem(errors) : null;
  }
}
