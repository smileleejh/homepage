using Microsoft.AspNetCore.Identity;

namespace backend.Domain;

/// <summary>
/// ASP.NET Core Identity 사용자.
/// email · 비밀번호 해시 · 이메일 확인 · 잠금은 <see cref="IdentityUser"/>가 기본 제공하고,
/// name · department · status만 커스텀으로 추가한다. (PRD §5.1)
/// </summary>
public class ApplicationUser : IdentityUser
{
  /// <summary>이름</summary>
  public string Name { get; set; } = string.Empty;

  /// <summary>부서</summary>
  public string? Department { get; set; }

  /// <summary>계정 상태 (기본 Pending — 이메일 인증 전)</summary>
  public UserStatus Status { get; set; } = UserStatus.Pending;

  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
