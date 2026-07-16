using backend.Domain;
using Microsoft.AspNetCore.Identity;

namespace backend.Infrastructure;

/// <summary>
/// 개발용 이메일 발송기. 실제 발송 대신 인증/재설정 링크를 로그로 출력한다.
/// 운영에서는 SMTP/SendGrid/Azure Communication Services 실제 구현으로 교체한다. (PRD §8.2)
/// </summary>
public class LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    : IEmailSender<ApplicationUser>
{
  public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
  {
    logger.LogInformation("[이메일 인증] {Email} → {Link}", email, confirmationLink);
    return Task.CompletedTask;
  }

  public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
  {
    logger.LogInformation("[비밀번호 재설정 링크] {Email} → {Link}", email, resetLink);
    return Task.CompletedTask;
  }

  public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
  {
    logger.LogInformation("[비밀번호 재설정 코드] {Email} → {Code}", email, resetCode);
    return Task.CompletedTask;
  }
}
