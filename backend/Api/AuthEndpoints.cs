using System.Text;
using System.Text.Encodings.Web;
using backend.Data;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace backend.Api;

/// <summary>직원 회원가입 요청 (P-08)</summary>
public record SignupRequest(string Email, string Password, string Name, string? Department);

/// <summary>
/// 가입 폼에 표시할 규칙 (P-08).
/// 화면 문구를 하드코딩하면 서버 설정과 어긋나므로 실제 IdentityOptions·설정값을 그대로 내려준다.
/// </summary>
public record SignupPolicy(
    int RequiredLength,
    bool RequireUppercase,
    bool RequireLowercase,
    bool RequireDigit,
    bool RequireNonAlphanumeric,
    int RequiredUniqueChars,
    IReadOnlyList<string> AllowedEmailDomains);

public static class AuthEndpoints
{
  public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
  {
    // 공개: 가입 규칙 조회 — 비밀번호 정책과 허용 이메일 도메인을 가입 폼에 표시하기 위한 것
    app.MapGet("/api/auth/signup-policy", (
        IOptions<IdentityOptions> identityOptions,
        IConfiguration config) =>
    {
      var password = identityOptions.Value.Password;
      var domains = config.GetSection("Auth:AllowedEmailDomains").Get<string[]>() ?? [];

      return Results.Ok(new SignupPolicy(
          password.RequiredLength,
          password.RequireUppercase,
          password.RequireLowercase,
          password.RequireDigit,
          password.RequireNonAlphanumeric,
          password.RequiredUniqueChars,
          domains));
    });

    // 직원 회원가입: 회사 이메일 도메인 화이트리스트 + 이름/부서 저장 (F-AUTH-01)
    // 이메일 인증은 Identity confirmEmail 엔드포인트를 그대로 사용한다.
    app.MapPost("/api/auth/signup", async (
      SignupRequest req,
      UserManager<ApplicationUser> userManager,
      IEmailSender<ApplicationUser> emailSender,
      IConfiguration config,
      HttpContext http) =>
    {
      // 1) 필수값 검증
      if (string.IsNullOrWhiteSpace(req.Email) ||
          string.IsNullOrWhiteSpace(req.Password) ||
          string.IsNullOrWhiteSpace(req.Name))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["required"] = ["이메일·비밀번호·이름은 필수입니다."],
        });
      }

      // 2) 회사 이메일 도메인 화이트리스트 검증
      var allowed = config.GetSection("Auth:AllowedEmailDomains").Get<string[]>() ?? [];
      var domain = req.Email.Split('@').LastOrDefault()?.Trim().ToLowerInvariant() ?? "";
      var isAllowed = allowed.Any(d => d.Trim().ToLowerInvariant() == domain);
      if (!isAllowed)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["email"] = [$"허용된 회사 이메일 도메인이 아닙니다. (허용: {string.Join(", ", allowed)})"],
        });
      }

      // 3) 사용자 생성 (Status=Pending — 이메일 인증 전)
      var user = new ApplicationUser
      {
        UserName = req.Email,
        Email = req.Email,
        Name = req.Name,
        Department = req.Department,
        Status = UserStatus.Pending,
      };

      var result = await userManager.CreateAsync(user, req.Password);
      if (!result.Succeeded)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["identity"] = result.Errors.Select(e => e.Description).ToArray(),
        });
      }

      // 4) 기본 역할(employee) 부여 — 역할 기반 인가(F-CMN-01)의 전제
      var roleResult = await userManager.AddToRoleAsync(user, DbSeeder.EmployeeRole);
      if (!roleResult.Succeeded)
      {
        // 역할 부여 실패는 계정만 남고 권한이 없는 상태가 되므로 가입을 롤백한다
        await userManager.DeleteAsync(user);
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["role"] = ["기본 권한 부여에 실패했습니다. 잠시 후 다시 시도하세요."],
        });
      }

      // 5) 이메일 인증 링크 발송 (Identity confirmEmail 과 동일한 토큰 형식)
      var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
      var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
      var confirmUrl = $"{http.Request.Scheme}://{http.Request.Host}/api/auth/confirmEmail?userId={user.Id}&code={code}";
      await emailSender.SendConfirmationLinkAsync(user, req.Email, HtmlEncoder.Default.Encode(confirmUrl));

      return Results.Ok(new { message = "가입 신청이 완료되었습니다. 이메일 인증 후 로그인하세요." });
    });

    return app;
  }
}
