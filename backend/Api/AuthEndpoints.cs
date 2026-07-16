using System.Text;
using System.Text.Encodings.Web;
using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace backend.Api;

/// <summary>직원 회원가입 요청 (P-08)</summary>
public record SignupRequest(string Email, string Password, string Name, string? Department);

public static class AuthEndpoints
{
  public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
  {
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

      // 4) 이메일 인증 링크 발송 (Identity confirmEmail 과 동일한 토큰 형식)
      var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
      var code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
      var confirmUrl = $"{http.Request.Scheme}://{http.Request.Host}/api/auth/confirmEmail?userId={user.Id}&code={code}";
      await emailSender.SendConfirmationLinkAsync(user, req.Email, HtmlEncoder.Default.Encode(confirmUrl));

      return Results.Ok(new { message = "가입 신청이 완료되었습니다. 이메일 인증 후 로그인하세요." });
    });

    return app;
  }
}
