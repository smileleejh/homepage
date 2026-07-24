using System.Security.Claims;
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

/// <summary>내 프로필 응답 (E-05)</summary>
public record ProfileResponse(
    string Email,
    string Name,
    string? Department,
    string Status,
    IReadOnlyList<string> Roles);

/// <summary>프로필(이름·부서) 수정 요청 (E-05)</summary>
public record UpdateProfileRequest(string Name, string? Department);

/// <summary>비밀번호 변경 요청 (E-05)</summary>
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

/// <summary>비밀번호 재설정 요청 — 링크 발송 (P-10 / F-AUTH-05)</summary>
public record ForgotPasswordRequest(string Email);

/// <summary>비밀번호 재설정 실행 — 링크의 코드로 새 비밀번호 설정 (P-10 / F-AUTH-05)</summary>
public record ResetPasswordRequest(string Email, string Code, string NewPassword);

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

    // 비밀번호 재설정 링크 요청 (F-AUTH-05)
    // 계정 존재 여부를 노출하지 않기 위해 어떤 입력에도 동일한 200을 돌려준다.
    // 링크는 프론트 재설정 페이지(/reset-password)로 향한다 — confirmEmail(백엔드)과 달리
    // 사용자가 새 비밀번호를 입력하는 화면이기 때문이다.
    app.MapPost("/api/auth/forgot-password", async (
        ForgotPasswordRequest req,
        UserManager<ApplicationUser> userManager,
        IEmailSender<ApplicationUser> emailSender,
        IConfiguration config) =>
    {
      if (!string.IsNullOrWhiteSpace(req.Email))
      {
        var user = await userManager.FindByEmailAsync(req.Email);
        // 이메일 인증을 마친 계정에만 보낸다(미인증 계정은 재설정 대상이 아니다)
        if (user is not null && await userManager.IsEmailConfirmedAsync(user))
        {
          var token = await userManager.GeneratePasswordResetTokenAsync(user);
          var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
          var baseUrl = (config["Frontend:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');
          var link = $"{baseUrl}/reset-password?email={Uri.EscapeDataString(req.Email)}&code={code}";
          await emailSender.SendPasswordResetLinkAsync(user, req.Email, HtmlEncoder.Default.Encode(link));
        }
      }

      return Results.Ok(new { message = "입력하신 이메일이 가입되어 있다면 재설정 링크를 보냈습니다." });
    });

    // 비밀번호 재설정 실행 (F-AUTH-05)
    app.MapPost("/api/auth/reset-password", async (
        ResetPasswordRequest req,
        UserManager<ApplicationUser> userManager) =>
    {
      if (string.IsNullOrWhiteSpace(req.Email) ||
          string.IsNullOrWhiteSpace(req.Code) ||
          string.IsNullOrWhiteSpace(req.NewPassword))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["required"] = ["이메일·재설정 코드·새 비밀번호가 모두 필요합니다."],
        });
      }

      // 계정 없음/미인증/코드 손상은 모두 "링크가 유효하지 않음"으로 묶는다(계정 노출 방지)
      var invalidLink = new Dictionary<string, string[]>
      {
        ["code"] = ["재설정 링크가 유효하지 않거나 만료되었습니다. 다시 요청해 주세요."],
      };

      var user = await userManager.FindByEmailAsync(req.Email);
      if (user is null || !await userManager.IsEmailConfirmedAsync(user))
      {
        return Results.ValidationProblem(invalidLink);
      }

      string token;
      try
      {
        token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(req.Code));
      }
      catch (FormatException)
      {
        return Results.ValidationProblem(invalidLink);
      }

      var result = await userManager.ResetPasswordAsync(user, token, req.NewPassword);
      if (!result.Succeeded)
      {
        // 토큰 오류(만료·위조)와 비밀번호 정책 위반을 구분해 안내한다
        if (result.Errors.Any(e => e.Code == "InvalidToken"))
        {
          return Results.ValidationProblem(invalidLink);
        }
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["password"] = result.Errors.Select(e => e.Description).ToArray(),
        });
      }

      // 재설정 성공 — 실패 횟수로 잠겨 있었다면 함께 풀어 바로 로그인할 수 있게 한다
      await userManager.ResetAccessFailedCountAsync(user);
      await userManager.SetLockoutEndDateAsync(user, null);

      return Results.Ok(new { message = "비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요." });
    });

    // 내 프로필 그룹 (E-05) — 로그인 사용자 본인
    var profile = app.MapGroup("/api/auth/profile").RequireAuthorization();

    // 프로필 조회 — 폼 초기값(이름·부서·이메일)
    profile.MapGet("/", async (
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal principal) =>
    {
      var user = await userManager.GetUserAsync(principal);
      if (user is null)
      {
        return Results.NotFound();
      }

      var roles = await userManager.GetRolesAsync(user);
      return Results.Ok(new ProfileResponse(
          user.Email ?? "", user.Name, user.Department, user.Status.ToString(), roles.ToList()));
    });

    // 프로필 수정 — 이름·부서만. 이메일·상태·역할은 여기서 바꿀 수 없다.
    profile.MapPut("/", async (
        UpdateProfileRequest req,
        UserManager<ApplicationUser> userManager,
        ClaimsPrincipal principal) =>
    {
      if (string.IsNullOrWhiteSpace(req.Name))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["name"] = ["이름은 필수입니다."],
        });
      }

      var user = await userManager.GetUserAsync(principal);
      if (user is null)
      {
        return Results.NotFound();
      }

      user.Name = req.Name.Trim();
      // 빈 문자열은 "부서 없음"으로 저장한다(공백만 입력한 경우 포함)
      user.Department = string.IsNullOrWhiteSpace(req.Department) ? null : req.Department.Trim();
      user.UpdatedAt = DateTimeOffset.UtcNow;

      var result = await userManager.UpdateAsync(user);
      if (!result.Succeeded)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["identity"] = result.Errors.Select(e => e.Description).ToArray(),
        });
      }

      return Results.NoContent();
    });

    // 비밀번호 변경 — 현재 비밀번호 확인 후 교체
    profile.MapPost("/password", async (
        ChangePasswordRequest req,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ClaimsPrincipal principal) =>
    {
      if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          ["required"] = ["현재 비밀번호와 새 비밀번호를 모두 입력하세요."],
        });
      }

      var user = await userManager.GetUserAsync(principal);
      if (user is null)
      {
        return Results.NotFound();
      }

      // ChangePasswordAsync는 현재 비밀번호를 검증하고, 성공 시 보안 스탬프를 갱신한다
      var result = await userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
      if (!result.Succeeded)
      {
        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
          // 현재 비밀번호 불일치·새 비밀번호 정책 위반 등 Identity 사유를 그대로 전달
          ["password"] = result.Errors.Select(e => e.Description).ToArray(),
        });
      }

      // 보안 스탬프가 바뀌면 현재 쿠키 세션도 곧 무효화된다 — 재로그인시켜 세션을 유지한다
      // (그렇지 않으면 비밀번호를 바꾼 본인이 다음 요청에서 로그아웃된다)
      await signInManager.RefreshSignInAsync(user);

      return Results.NoContent();
    });

    return app;
  }
}
