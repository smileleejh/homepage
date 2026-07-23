using backend.Domain;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace backend.Infrastructure;

/// <summary>
/// 커스텀 SignInManager — Identity 기본 검사(이메일 인증·잠금)에 계정 상태(Status) 검사를 더한다.
/// Active가 아닌 계정(Pending 미인증 · Suspended 정지)은 로그인을 거부한다. (DESIGN §4.5 상태 정책)
/// </summary>
public class ApplicationSignInManager : SignInManager<ApplicationUser>
{
  public ApplicationSignInManager(
      UserManager<ApplicationUser> userManager,
      IHttpContextAccessor contextAccessor,
      IUserClaimsPrincipalFactory<ApplicationUser> claimsFactory,
      IOptions<IdentityOptions> optionsAccessor,
      ILogger<SignInManager<ApplicationUser>> logger,
      IAuthenticationSchemeProvider schemes,
      IUserConfirmation<ApplicationUser> confirmation)
      : base(userManager, contextAccessor, claimsFactory, optionsAccessor, logger, schemes, confirmation)
  {
  }

  /// <summary>
  /// 로그인 가능 여부 판정. 기본 검사를 통과하더라도 상태가 Active가 아니면 거부한다.
  /// 거부 시 PasswordSignInAsync는 SignInResult.NotAllowed를 반환하고 로그인 엔드포인트는 401을 낸다.
  /// </summary>
  public override async Task<bool> CanSignInAsync(ApplicationUser user)
  {
    // 이메일 미인증·잠금 등 Identity 기본 검사가 먼저다
    if (!await base.CanSignInAsync(user))
    {
      return false;
    }

    if (user.Status == UserStatus.Active)
    {
      return true;
    }

    Logger.LogWarning("로그인 차단 — 계정 상태 {Status}: {Email}", user.Status, user.Email);
    return false;
  }
}
