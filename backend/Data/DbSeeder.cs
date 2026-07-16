using backend.Domain;
using Microsoft.AspNetCore.Identity;

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

    // 2) 부트스트랩 관리자 멱등 생성 (설정값이 있을 때만)
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
      return; // 이미 존재 — 멱등
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
}
