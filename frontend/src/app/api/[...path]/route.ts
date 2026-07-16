import type { NextRequest } from "next/server";

// BFF 프록시: 브라우저의 /api/* 요청을 백엔드(ASP.NET Core)로 전달하고
// 인증 쿠키(요청의 Cookie / 응답의 Set-Cookie)를 그대로 중계한다. (PRD/DESIGN §8.3)
const BACKEND = process.env.BACKEND_API_URL ?? "http://localhost:5259";

// 홉바이홉/인코딩 헤더는 중계하지 않는다(본문을 버퍼링하므로 재계산되게 둔다).
const SKIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "set-cookie",
]);

async function handle(request: NextRequest): Promise<Response> {
  const subPath = request.nextUrl.pathname.replace(/^\/api\//, "");
  const target = `${BACKEND}/api/${subPath}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let backendRes: Response;
  try {
    backendRes = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    return new Response("백엔드에 연결할 수 없습니다.", { status: 502 });
  }

  // 압축 해제된 본문을 그대로 전달하고 인코딩 헤더는 제거
  const body = await backendRes.arrayBuffer();
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
  });

  // Set-Cookie는 개별 항목으로 재설정(병합되지 않도록)
  const setCookies = backendRes.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) responseHeaders.append("set-cookie", cookie);

  return new Response(body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
