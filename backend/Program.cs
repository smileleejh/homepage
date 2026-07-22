using System.Security.Claims;
using backend.Api;
using backend.Data;
using backend.Domain;
using backend.Infrastructure;
using Microsoft.AspNetCore.Identity;
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
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddAuthorization();

// 개발용 이메일 발송기(로그 출력) — 운영에서 실제 발송기로 교체
builder.Services.AddTransient<IEmailSender<ApplicationUser>, LoggingEmailSender>();

// CORS: 프론트 개발 서버 허용 (BFF 동일 사이트 배포 시에는 불필요)
const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCors, policy => policy
        .WithOrigins("http://localhost:3000")
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod()));

var app = builder.Build();

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

// 시작 시 역할·부트스트랩 관리자 시드 (마이그레이션 적용 후 테이블 존재 전제)
using (var scope = app.Services.CreateScope())
{
  await DbSeeder.SeedAsync(scope.ServiceProvider);
}

app.Run();
