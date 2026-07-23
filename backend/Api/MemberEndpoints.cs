using backend.Data;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Api;

/// <summary>회원 목록 항목 (A-04)</summary>
public record MemberListItem(
    string Id,
    string Email,
    string Name,
    string? Department,
    string Status,
    IReadOnlyList<string> Roles,
    bool EmailConfirmed,
    DateTimeOffset CreatedAt);

/// <summary>회원 목록 페이지네이션 결과 (A-04)</summary>
public record PagedMembers(
    IReadOnlyList<MemberListItem> Items,
    int Total,
    int Page,
    int PageSize);

/// <summary>
/// 회원 상태·권한 변경 요청 (F-ADM-01).
/// Status: Pending/Active/Suspended (가입 승인·정지·해제), Role: employee/admin (권한 변경).
/// 각 필드 null이면 변경하지 않는다.
/// </summary>
public record UpdateMemberRequest(string? Status, string? Role);

public static class MemberEndpoints
{
  public static IEndpointRouteBuilder MapMemberEndpoints(this IEndpointRouteBuilder app)
  {
    // 회원 관리 그룹 (A-04) — admin 역할만
    var members = app.MapGroup("/api/admin/members")
        .RequireAuthorization(policy => policy.RequireRole(DbSeeder.AdminRole));

    // 목록/검색 (F-ADM-01) — 이름·이메일 키워드, 상태, 역할 필터 + 페이지네이션
    members.MapGet("/", async (
        string? q, string? status, string? role, int? page, int? pageSize,
        ApplicationDbContext db) =>
    {
      var currentPage = page is > 0 ? page.Value : 1;
      var size = pageSize is > 0 and <= 50 ? pageSize.Value : 20;

      var query = db.Users.AsQueryable();

      // 키워드(이름·이메일)
      if (!string.IsNullOrWhiteSpace(q))
      {
        var term = q.Trim().ToLower();
        query = query.Where(u =>
            u.Name.ToLower().Contains(term) ||
            (u.Email != null && u.Email.ToLower().Contains(term)));
      }

      // 상태 필터
      if (!string.IsNullOrWhiteSpace(status) &&
          Enum.TryParse<UserStatus>(status, true, out var st) && Enum.IsDefined(st))
      {
        query = query.Where(u => u.Status == st);
      }

      // 역할 필터 — 해당 역할에 속한 사용자만
      if (!string.IsNullOrWhiteSpace(role))
      {
        var roleId = await db.Roles
            .Where(r => r.Name == role)
            .Select(r => r.Id)
            .FirstOrDefaultAsync();
        query = roleId is not null
            ? query.Where(u => db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == roleId))
            : query.Where(u => false); // 존재하지 않는 역할 → 결과 없음
      }

      var total = await query.CountAsync();
      var pageUsers = await query
          .OrderBy(u => u.Name)
          .Skip((currentPage - 1) * size)
          .Take(size)
          .Select(u => new
          {
            u.Id,
            u.Email,
            u.Name,
            u.Department,
            u.Status,
            u.EmailConfirmed,
            u.CreatedAt,
          })
          .ToListAsync();

      // 페이지 내 사용자들의 역할을 한 번에 조회 (N+1 회피)
      var ids = pageUsers.Select(u => u.Id).ToList();
      var roleRows = await (
          from ur in db.UserRoles
          join r in db.Roles on ur.RoleId equals r.Id
          where ids.Contains(ur.UserId)
          select new { ur.UserId, RoleName = r.Name! })
          .ToListAsync();
      var roleMap = roleRows
          .GroupBy(x => x.UserId)
          .ToDictionary(g => g.Key, g => g.Select(x => x.RoleName).ToList());

      var items = pageUsers.Select(u => new MemberListItem(
          u.Id, u.Email ?? "", u.Name, u.Department, u.Status.ToString(),
          roleMap.TryGetValue(u.Id, out var rs) ? rs : new List<string>(),
          u.EmailConfirmed, u.CreatedAt)).ToList();

      return Results.Ok(new PagedMembers(items, total, currentPage, size));
    });

    // 상태·권한 변경 (승인/거절·정지/해제·권한 변경)
    members.MapPatch("/{id}", async (
        string id,
        UpdateMemberRequest req,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal currentUser) =>
    {
      var target = await userManager.FindByIdAsync(id);
      if (target is null)
      {
        return Results.NotFound();
      }

      // 상태 파싱
      UserStatus? newStatus = null;
      if (!string.IsNullOrWhiteSpace(req.Status))
      {
        if (!Enum.TryParse<UserStatus>(req.Status, true, out var st) || !Enum.IsDefined(st))
        {
          return Results.ValidationProblem(new Dictionary<string, string[]>
          {
            ["status"] = ["유효한 상태가 아닙니다. (Pending / Active / Suspended)"],
          });
        }
        newStatus = st;
      }

      // 역할 검증 (employee | admin)
      string? newRole = null;
      if (!string.IsNullOrWhiteSpace(req.Role))
      {
        var normalized = req.Role.Trim().ToLowerInvariant();
        if (normalized != DbSeeder.EmployeeRole && normalized != DbSeeder.AdminRole)
        {
          return Results.ValidationProblem(new Dictionary<string, string[]>
          {
            ["role"] = ["유효한 역할이 아닙니다. (employee / admin)"],
          });
        }
        newRole = normalized;
      }

      // 본인 계정 잠금 방지: 스스로 관리자 강등·정지는 막는다
      var selfId = userManager.GetUserId(currentUser);
      if (selfId == target.Id &&
          ((newRole is not null && newRole != DbSeeder.AdminRole) ||
           (newStatus is not null && newStatus != UserStatus.Active)))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["self"] = ["본인 계정의 권한·상태는 변경할 수 없습니다."],
        });
      }

      // 역할 변경 — 정확히 하나의 역할만 갖도록 정규화
      if (newRole is not null)
      {
        var currentRoles = await userManager.GetRolesAsync(target);
        var toRemove = currentRoles.Where(r => r != newRole).ToList();
        if (toRemove.Count > 0)
        {
          await userManager.RemoveFromRolesAsync(target, toRemove);
        }
        if (!currentRoles.Contains(newRole))
        {
          await userManager.AddToRoleAsync(target, newRole);
        }
      }

      // 상태 변경
      if (newStatus is not null)
      {
        target.Status = newStatus.Value;
        target.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(target);

        // 비활성 전환은 로그인 차단만으로 끝나지 않는다 — 이미 로그인해 둔 쿠키 세션이 남아 있으면
        // 정지시켜도 계속 이용할 수 있다. 보안 스탬프를 갱신해 기존 세션을 무효화한다.
        if (newStatus.Value != UserStatus.Active)
        {
          await userManager.UpdateSecurityStampAsync(target);
        }
      }

      return Results.NoContent();
    });

    return app;
  }
}
