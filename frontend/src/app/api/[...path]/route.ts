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

// 본문을 가질 수 없는 상태 코드 — 빈 body라도 넘기면 Response 생성자가 예외를 던진다(204 삭제 등)
const NULL_BODY_STATUSES = new Set([101, 103, 204, 205, 304]);

// 클라이언트가 직접 채워 보낼 수 있어 그대로 넘기면 안 되는 전달 헤더.
// x-forwarded-for는 아래에서 BFF가 확정한 값으로 다시 설정한다.
const SPOOFABLE_REQUEST_HEADERS = ["x-forwarded-host", "x-real-ip", "forwarded"];

/**
 * 백엔드에 알려줄 클라이언트 IP를 정한다.
 *
 * 백엔드 입장에서 모든 요청의 발신지는 이 BFF라서, 그대로 두면 IP 기준 Rate Limit이
 * 전원 공용 한도가 되고 문의의 접수 IP도 BFF 것만 남는다.
 *
 * X-Forwarded-For는 프록시가 자신이 본 주소를 뒤에 덧붙이는 형식이므로 **마지막 항목**만 신뢰한다.
 * 앞쪽은 클라이언트가 임의로 채워 넣을 수 있다.
 * 주의: 리버스 프록시 없이 브라우저가 Next에 직접 붙는 로컬 개발에서는 Next가 클라이언트가 보낸
 * 헤더를 유지하므로(값이 없을 때만 소켓 주소를 넣는다) 이 값이 위조될 수 있다. 운영에서는
 * 앞단 프록시(Vercel/nginx)가 항상 실제 주소를 덧붙이거나 덮어쓰므로 마지막 항목이 진짜다.
 */
function resolveClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const entries = forwarded
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

async function handle(request: NextRequest): Promise<Response> {
  const subPath = request.nextUrl.pathname.replace(/^\/api\//, "");
  const target = `${BACKEND}/api/${subPath}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  // 전달 헤더는 클라이언트가 준 값을 버리고 BFF가 판단한 값으로 다시 세운다
  for (const header of SPOOFABLE_REQUEST_HEADERS) headers.delete(header);
  const clientIp = resolveClientIp(request);
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  } else {
    headers.delete("x-forwarded-for");
  }

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
  // (204/304 등은 본문 없이 반환 — 그렇지 않으면 Response 생성자가 예외)
  const body = NULL_BODY_STATUSES.has(backendRes.status)
    ? null
    : await backendRes.arrayBuffer();
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
