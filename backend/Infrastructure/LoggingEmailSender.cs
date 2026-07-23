using System.Net;
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
  // 호출측(Identity MapIdentityApi·커스텀 signup)은 HTML 본문 삽입을 전제로 링크를 인코딩해서 넘긴다.
  // 그 결과 쿼리 구분자 &가 &amp;로 바뀌어, 로그를 그대로 브라우저에 붙여넣으면
  // code 파라미터가 "amp;code"로 잘못 파싱되어 인증이 실패한다.
  // 이 발송기의 출력은 개발자가 복사해 쓰는 용도이므로 디코드해서 남긴다.
  private static string ToClickable(string link) => WebUtility.HtmlDecode(link);

  public Task SendConfirmationLinkAsync(ApplicationUser user, string email, string confirmationLink)
  {
    logger.LogInformation("[이메일 인증] {Email} → {Link}", email, ToClickable(confirmationLink));
    return Task.CompletedTask;
  }

  public Task SendPasswordResetLinkAsync(ApplicationUser user, string email, string resetLink)
  {
    logger.LogInformation("[비밀번호 재설정 링크] {Email} → {Link}", email, ToClickable(resetLink));
    return Task.CompletedTask;
  }

  public Task SendPasswordResetCodeAsync(ApplicationUser user, string email, string resetCode)
  {
    logger.LogInformation("[비밀번호 재설정 코드] {Email} → {Code}", email, ToClickable(resetCode));
    return Task.CompletedTask;
  }
}
