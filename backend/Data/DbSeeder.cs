using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

/// <summary>
/// 초기 데이터 시드: 역할(employee/admin)과 부트스트랩 관리자 계정을 멱등하게 생성한다.
/// 관리자 계정은 설정값 Seed:AdminEmail / Seed:AdminPassword 로 주입(user-secrets 권장).
/// </summary>
public static class DbSeeder
{
  public const string EmployeeRole = "employee";
  public const string AdminRole = "admin";

  public static async Task SeedAsync(IServiceProvider services)
  {
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var db = services.GetRequiredService<ApplicationDbContext>();
    var config = services.GetRequiredService<IConfiguration>();
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");

    // 1) 역할 멱등 생성
    foreach (var role in new[] { EmployeeRole, AdminRole })
    {
      if (!await roleManager.RoleExistsAsync(role))
      {
        await roleManager.CreateAsync(new IdentityRole(role));
        logger.LogInformation("역할 생성: {Role}", role);
      }
    }

    // 1.5) 역할이 없는 기존 사용자 보정 — 초기 가입 로직에 역할 부여가 빠져 있던 계정을 employee로 복구
    var roleIds = await db.Roles.Select(r => r.Id).ToListAsync();
    var orphanIds = await db.Users
        .Where(u => !db.UserRoles.Any(ur => ur.UserId == u.Id && roleIds.Contains(ur.RoleId)))
        .Select(u => u.Id)
        .ToListAsync();
    foreach (var userId in orphanIds)
    {
      var user = await userManager.FindByIdAsync(userId);
      if (user is null) continue;
      await userManager.AddToRoleAsync(user, EmployeeRole);
      logger.LogInformation("역할 없는 계정 보정: {Email} → {Role}", user.Email, EmployeeRole);
    }

    // 1.6) 레거시 보정 — 인증 후 상태 전환 로직이 없던 시기에 만들어진
    // "이메일 인증 완료 + Pending" 계정을 Active로 올린다.
    // 신규 가입은 ApplicationUserManager.ConfirmEmailAsync가 처리하므로 평소에는 필요 없다.
    // 무조건 실행하면 관리자가 A-04에서 Pending으로 되돌린 계정까지 재시작마다 되살아나므로
    // Seed:PromoteConfirmedUsers=true 인 경우에만 1회성으로 실행한다.
    if (config.GetValue<bool>("Seed:PromoteConfirmedUsers"))
    {
      var promoted = await db.Users
          .Where(u => u.EmailConfirmed && u.Status == UserStatus.Pending)
          .ExecuteUpdateAsync(s => s
              .SetProperty(u => u.Status, UserStatus.Active)
              .SetProperty(u => u.UpdatedAt, DateTimeOffset.UtcNow));
      logger.LogWarning(
          "Seed:PromoteConfirmedUsers=true — 이메일 인증 완료 계정 상태 보정: {Count}건 → Active. " +
          "보정 후 이 설정을 false로 되돌리세요.", promoted);
    }

    // 2) 게시판 카테고리 멱등 생성 (프론트 slug와 일치 — notice/free/resource/team)
    var seedCategories = new[]
    {
      (Slug: "notice", Name: "공지사항", SortOrder: 1),
      (Slug: "free", Name: "자유게시판", SortOrder: 2),
      (Slug: "resource", Name: "업무자료", SortOrder: 3),
      (Slug: "team", Name: "팀 소식", SortOrder: 4),
    };
    foreach (var (slug, name, sortOrder) in seedCategories)
    {
      if (!await db.Categories.AnyAsync(c => c.Slug == slug))
      {
        db.Categories.Add(new Category { Slug = slug, Name = name, SortOrder = sortOrder });
        logger.LogInformation("카테고리 생성: {Slug}", slug);
      }
    }
    await db.SaveChangesAsync();

    // 2.5) CMS 편집 콘텐츠(page_contents) 멱등 생성 — 화이트리스트 키(인사말/배너/공지)
    foreach (var def in PageContentKeys.All)
    {
      if (!await db.PageContents.AnyAsync(p => p.Key == def.Key))
      {
        db.PageContents.Add(new PageContent
        {
          Key = def.Key,
          Title = def.DefaultTitle,
          Body = def.DefaultBody,
          IsVisible = def.DefaultVisible,
        });
        logger.LogInformation("CMS 콘텐츠 생성: {Key}", def.Key);
      }
    }
    await db.SaveChangesAsync();

    // 3) 부트스트랩 관리자 멱등 생성 (설정값이 있을 때만)
    var adminEmail = config["Seed:AdminEmail"];
    var adminPassword = config["Seed:AdminPassword"];
    if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
    {
      logger.LogWarning("Seed:AdminEmail/AdminPassword 미설정 — 관리자 시드를 건너뜁니다.");
      return;
    }

    var existing = await userManager.FindByEmailAsync(adminEmail);
    if (existing is not null)
    {
      // 이미 존재 — 기본은 아무것도 건드리지 않는다(비밀번호를 조용히 덮어쓰지 않음).
      // 단 Seed:ResetAdminPassword=true 인 경우에만 잠긴 관리자 계정을 복구한다.
      // 개발 환경에서 이메일 발송기가 로그 출력뿐이라 forgotPassword 코드를 못 읽는 상황의 탈출구.
      if (!config.GetValue<bool>("Seed:ResetAdminPassword"))
      {
        return;
      }

      await RecoverAdminAsync(userManager, existing, adminPassword, logger);
      return;
    }

    var admin = new ApplicationUser
    {
      UserName = adminEmail,
      Email = adminEmail,
      EmailConfirmed = true,          // 이메일 인증 없이 즉시 로그인 가능
      Name = "관리자",
      Status = UserStatus.Active,
    };

    var result = await userManager.CreateAsync(admin, adminPassword);
    if (result.Succeeded)
    {
      await userManager.AddToRoleAsync(admin, AdminRole);
      logger.LogInformation("부트스트랩 관리자 생성: {Email}", adminEmail);
    }
    else
    {
      logger.LogError("관리자 시드 실패: {Errors}",
          string.Join(", ", result.Errors.Select(e => e.Description)));
    }
  }

  /// <summary>
  /// 잠긴 부트스트랩 관리자 복구 — 비밀번호를 Seed:AdminPassword로 재설정하고
  /// 로그인을 막는 조건(이메일 미인증 · 비활성 상태 · admin 역할 누락 · 잠금)을 함께 해제한다.
  /// Seed:ResetAdminPassword=true 일 때만 호출된다.
  /// </summary>
  private static async Task RecoverAdminAsync(
      UserManager<ApplicationUser> userManager,
      ApplicationUser admin,
      string newPassword,
      ILogger logger)
  {
    // 비밀번호 재설정 — 기존 비밀번호를 몰라도 되도록 토큰 경유로 교체한다
    var token = await userManager.GeneratePasswordResetTokenAsync(admin);
    var result = await userManager.ResetPasswordAsync(admin, token, newPassword);
    if (!result.Succeeded)
    {
      logger.LogError("관리자 비밀번호 복구 실패: {Errors}",
          string.Join(", ", result.Errors.Select(e => e.Description)));
      return;
    }

    // 로그인을 막는 나머지 조건도 함께 해제 (이메일 미인증 / 비활성 / 잠금)
    admin.EmailConfirmed = true;
    admin.Status = UserStatus.Active;
    admin.UpdatedAt = DateTimeOffset.UtcNow;
    await userManager.UpdateAsync(admin);
    await userManager.SetLockoutEndDateAsync(admin, null);
    await userManager.ResetAccessFailedCountAsync(admin);

    // 역할을 admin 하나로 정규화 (1.5단계 보정에서 employee가 붙었을 수 있다)
    var roles = await userManager.GetRolesAsync(admin);
    var stale = roles.Where(r => r != AdminRole).ToList();
    if (stale.Count > 0)
    {
      await userManager.RemoveFromRolesAsync(admin, stale);
    }
    if (!roles.Contains(AdminRole))
    {
      await userManager.AddToRoleAsync(admin, AdminRole);
    }

    logger.LogWarning(
        "Seed:ResetAdminPassword=true — 관리자 비밀번호를 재설정했습니다: {Email}. " +
        "복구 후 이 설정을 반드시 false로 되돌리세요.", admin.Email);
  }
}
