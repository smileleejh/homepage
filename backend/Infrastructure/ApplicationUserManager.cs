using backend.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace backend.Infrastructure;

/// <summary>
/// 커스텀 UserManager — Identity 기본 동작에 계정 상태(Status) 동기화를 얹는다.
/// 이메일 인증이 끝나면 Pending → Active 로 전환한다. (F-AUTH-02)
/// MapIdentityApi의 confirmEmail·resendConfirmationEmail 이 모두 ConfirmEmailAsync를 거치므로
/// 여기 한 곳만 재정의하면 모든 인증 경로가 커버된다.
/// </summary>
public class ApplicationUserManager : UserManager<ApplicationUser>
{
  public ApplicationUserManager(
      IUserStore<ApplicationUser> store,
      IOptions<IdentityOptions> optionsAccessor,
      IPasswordHasher<ApplicationUser> passwordHasher,
      IEnumerable<IUserValidator<ApplicationUser>> userValidators,
      IEnumerable<IPasswordValidator<ApplicationUser>> passwordValidators,
      ILookupNormalizer keyNormalizer,
      IdentityErrorDescriber errors,
      IServiceProvider services,
      ILogger<UserManager<ApplicationUser>> logger)
      : base(store, optionsAccessor, passwordHasher, userValidators, passwordValidators,
             keyNormalizer, errors, services, logger)
  {
  }

  /// <summary>이메일 인증에 성공하면 계정 상태를 Active로 승격한다.</summary>
  public override async Task<IdentityResult> ConfirmEmailAsync(ApplicationUser user, string token)
  {
    var result = await base.ConfirmEmailAsync(user, token);

    // 정지(Suspended) 계정이 인증 링크로 되살아나면 안 되므로 Pending일 때만 승격한다
    if (!result.Succeeded || user.Status != UserStatus.Pending)
    {
      return result;
    }

    user.Status = UserStatus.Active;
    user.UpdatedAt = DateTimeOffset.UtcNow;

    var updateResult = await UpdateAsync(user);
    if (!updateResult.Succeeded)
    {
      // 상태 전환에 실패해도 이메일 인증 자체는 이미 성공했으므로 그대로 반환하고 로그만 남긴다.
      // 이 계정은 Pending으로 남아 로그인이 막히므로 관리자가 A-04에서 수동 활성화해야 한다.
      Logger.LogError("이메일 인증 후 상태 전환 실패: {Email} — {Errors}",
          user.Email, string.Join(", ", updateResult.Errors.Select(e => e.Description)));
    }

    return result;
  }
}
