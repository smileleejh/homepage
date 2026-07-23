using System.Net;
using System.Security.Claims;
using System.Threading.RateLimiting;
using backend.Api;
using backend.Data;
using backend.Domain;
using backend.Infrastructure;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 로컬 전용 설정(관리자 시드 등) — 커밋되지 않는 파일. 있으면 로드해 appsettings 값을 덮어쓴다.
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// OpenAPI 문서(개발용)
builder.Services.AddOpenApi();

// 데이터베이스: Supabase(PostgreSQL) — 연결 문자열은 사용자 비밀/환경변수로 주입
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default 연결 문자열이 필요합니다.");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 인증/계정: ASP.NET Core Identity (쿠키 기반 + JSON API 엔드포인트)
builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
      options.SignIn.RequireConfirmedEmail = true;   // 이메일 인증 필수 (F-AUTH-02)
      options.User.RequireUniqueEmail = true;
      options.Password.RequiredLength = 8;           // 비밀번호 정책 (F-AUTH-04)
    })
    .AddRoles<IdentityRole>()                          // employee / admin 역할
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddUserManager<ApplicationUserManager>()          // 이메일 인증 후 Status 승격 (F-AUTH-02)
    .AddSignInManager<ApplicationSignInManager>();     // Status != Active 로그인 차단 (DESIGN §4.5)

// 정지 처리된 계정의 기존 쿠키 세션을 언제 끊을지 — 보안 스탬프 재검증 주기.
// 기본값 30분은 정지 후에도 그만큼 계속 이용 가능하다는 뜻이라 5분으로 줄인다.
builder.Services.Configure<SecurityStampValidatorOptions>(options =>
    options.ValidationInterval = TimeSpan.FromMinutes(5));

builder.Services.AddAuthorization();

// 실제 클라이언트 IP 복원 — 브라우저는 Next.js BFF하고만 통신하므로, 그대로 두면 모든 요청의
// RemoteIpAddress가 BFF 서버 IP가 된다. IP 기준 Rate Limit이 전원 공용 한도로 무너지고
// 문의의 CreatedIp도 BFF IP만 남으므로, 신뢰하는 프록시가 붙인 X-Forwarded-For를 반영한다.
// KnownProxies 기본값은 루프백이라 개발(localhost BFF)은 설정 없이 동작하고,
// 운영에서 BFF가 다른 호스트면 Network:TrustedProxies에 그 IP를 넣어야 한다.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
  options.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
  options.ForwardLimit = 1;   // BFF 한 단계만 인정 — 그 앞의 값은 클라이언트가 위조할 수 있다
  foreach (var proxy in builder.Configuration.GetSection("Network:TrustedProxies").Get<string[]>() ?? [])
  {
    if (IPAddress.TryParse(proxy, out var address))
    {
      options.KnownProxies.Add(address);
    }
  }
});

// 공개 문의 폼 스팸 방지 (F-INQ-01) — IP당 고정 창(fixed window) 제한
builder.Services.AddRateLimiter(options =>
{
  options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
  options.OnRejected = (context, _) =>
  {
    context.HttpContext.Response.Headers.RetryAfter =
        ((int)InquiryEndpoints.RateLimitWindow.TotalSeconds).ToString();
    return ValueTask.CompletedTask;
  };

  options.AddPolicy(InquiryEndpoints.RateLimitPolicy, http =>
      RateLimitPartition.GetFixedWindowLimiter(
          // IP를 못 구하면 하나의 공용 버킷으로 묶는다 — 익명 트래픽을 무제한으로 두지 않는다
          partitionKey: http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
          factory: _ => new FixedWindowRateLimiterOptions
          {
            PermitLimit = InquiryEndpoints.RateLimitPermitLimit,
            Window = InquiryEndpoints.RateLimitWindow,
            QueueLimit = 0,   // 대기시키지 않고 즉시 429 — 폼 제출은 기다릴 이유가 없다
          }));
});

// 첨부파일 업로드 제한 (F-BRD-04)
builder.Services.Configure<UploadOptions>(
    builder.Configuration.GetSection(UploadOptions.SectionName));
var uploadOptions = builder.Configuration.GetSection(UploadOptions.SectionName).Get<UploadOptions>()
    ?? new UploadOptions();

// 요청 본문 한도를 업로드 제한에 맞춘다 — 엔드포인트에서 파일별로 다시 검증하지만,
// 그 전에 서버가 거대한 본문을 끝까지 읽어버리지 않도록 입구에서 막는다.
builder.Services.Configure<FormOptions>(options =>
    options.MultipartBodyLengthLimit = uploadOptions.MaxRequestBodyBytes);
builder.WebHost.ConfigureKestrel(options =>
    options.Limits.MaxRequestBodySize = uploadOptions.MaxRequestBodyBytes);

// 개발용 이메일 발송기(로그 출력) — 운영에서 실제 발송기로 교체
builder.Services.AddTransient<IEmailSender<ApplicationUser>, LoggingEmailSender>();

// 알림 메일 (F-INQ-03): 큐 + 백그라운드 발송기 + 발송 결과 email_logs 기록
builder.Services.Configure<EmailOptions>(
    builder.Configuration.GetSection(EmailOptions.SectionName));
builder.Services.AddScoped<IAppEmailSender, LoggingAppEmailSender>();
builder.Services.AddSingleton<EmailQueue>();
builder.Services.AddSingleton<IEmailQueue>(sp => sp.GetRequiredService<EmailQueue>());
builder.Services.AddHostedService<EmailDispatcher>();

// CORS: 프론트 개발 서버 허용 (BFF 동일 사이트 배포 시에는 불필요)
const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCors, policy => policy
        .WithOrigins("http://localhost:3000")
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

// 가장 먼저 실행해야 이후 미들웨어(Rate Limit 등)가 실제 클라이언트 IP를 보게 된다
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
  app.MapOpenApi();
}

// 개발에서는 BFF가 http로 프록시하므로 https 리다이렉트를 끈다(운영에서만 적용)
if (!app.Environment.IsDevelopment())
{
  app.UseHttpsRedirection();
}

app.UseCors(FrontendCors);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Identity API 엔드포인트 → /api/auth/{register, login, refresh, confirmEmail, resetPassword, ...}
app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();

// 커스텀 회원가입(도메인 화이트리스트 + 이름/부서) — F-AUTH-01
app.MapAuthEndpoints();

// 커스텀: 로그아웃 (Identity 기본 미제공)
app.MapPost("/api/auth/logout", async (SignInManager<ApplicationUser> signInManager) =>
{
  await signInManager.SignOutAsync();
  return Results.Ok();
}).RequireAuthorization();

// 현재 로그인 사용자 정보
app.MapGet("/api/auth/me", (ClaimsPrincipal user) => Results.Ok(new
{
  email = user.FindFirstValue(ClaimTypes.Email) ?? user.Identity?.Name,
  roles = user.FindAll(ClaimTypes.Role).Select(r => r.Value)
})).RequireAuthorization();

// 헬스체크
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

// 문의 접수/조회 엔드포인트
app.MapInquiryEndpoints();

// 사내 게시판 엔드포인트 (작성/목록/상세/카테고리)
app.MapPostEndpoints();

// 게시판 댓글 엔드포인트 (목록/작성/삭제)
app.MapCommentEndpoints();

// 게시판 첨부파일 엔드포인트 (업로드/목록/다운로드/삭제)
app.MapAttachmentEndpoints();

// 관리자: 회원 관리 (목록/상태·권한 변경)
app.MapMemberEndpoints();

// 관리자: 게시판 카테고리 관리 (생성/수정/삭제)
app.MapCategoryEndpoints();

// 관리자: 게시글·댓글 모더레이션 (목록/삭제/복구/공지고정)
app.MapModerationEndpoints();

// CMS 콘텐츠: 공개 조회 + 관리자 편집 (하이브리드 CMS)
app.MapContentEndpoints();

// 시작 시 역할·부트스트랩 관리자 시드 (마이그레이션 적용 후 테이블 존재 전제)
using (var scope = app.Services.CreateScope())
{
  await DbSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();
