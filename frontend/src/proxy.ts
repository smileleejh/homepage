import { NextResponse, type NextRequest } from "next/server";

// 보호 경로에 대한 optimistic 인증 체크(UX용 리다이렉트).
// 실제 인가는 백엔드 API의 [Authorize]가 최종 강제한다. (DESIGN §4.5)
const IDENTITY_COOKIE = ".AspNetCore.Identity.Application";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(IDENTITY_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 직원/관리자 영역만 가드 (공개·인증 페이지는 제외)
export const config = {
  matcher: ["/board/:path*", "/admin/:path*", "/me"],
};
