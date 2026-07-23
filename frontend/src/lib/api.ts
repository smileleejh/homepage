// 클라이언트 컴포넌트에서 BFF(/api/*)를 호출하는 얇은 래퍼.
// 인증 쿠키는 브라우저가 자동 전송하고, BFF가 백엔드로 포워딩한다.
//
// 실패 응답의 본문(HTML 오류 페이지 등)은 절대 화면 메시지로 쓰지 않는다.
// ProblemDetails JSON에서만 메시지를 뽑고, 그 외에는 상태코드별 안내 문구를 쓴다.

/** API 호출 실패. 호출부가 상태코드로 분기할 수 있도록 status를 함께 전달한다. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiFetchOptions {
  /**
   * 401 응답 시 로그인 페이지로 이동할지 여부 (기본 true).
   * 로그인 여부만 확인하는 프로브 호출(예: auth/me)은 공개 페이지에서도 쓰이므로 false로 끈다.
   */
  redirectOnUnauthorized?: boolean;
}

// 상태코드별 기본 안내 문구 — 응답 원문 노출을 대체한다
function statusMessage(status: number): string {
  switch (status) {
    case 400:
      return "입력값을 확인해 주세요.";
    case 403:
      return "권한이 없습니다.";
    case 404:
      return "대상을 찾을 수 없습니다.";
    case 409:
      return "이미 처리되었거나 다른 값과 충돌합니다.";
    case 413:
      return "요청 용량이 너무 큽니다.";
    case 429:
      return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    case 502:
    case 503:
    case 504:
      return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return status >= 500
        ? "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
        : `요청에 실패했습니다. (${status})`;
  }
}

/**
 * ASP.NET Core의 ProblemDetails / ValidationProblem 응답에서 사람이 읽을 메시지를 추출한다.
 * JSON이 아니면(HTML 오류 페이지 등) null을 반환해 원문이 화면에 노출되지 않게 한다.
 */
export function extractProblemMessage(raw: string): string | null {
  if (!raw) return null;
  try {
    const body = JSON.parse(raw);
    const errors = body?.errors as Record<string, string[]> | undefined;
    if (errors) {
      const first = Object.values(errors).find((messages) => messages?.[0]);
      if (first?.[0]) return first[0];
    }
    if (typeof body?.detail === "string" && body.detail) return body.detail;
    if (typeof body?.title === "string" && body.title) return body.title;
    return null;
  } catch {
    return null; // JSON 아님 — 원문을 메시지로 쓰지 않는다
  }
}

// 세션 만료 시 로그인 페이지로 이동. 이미 로그인 페이지면 이동하지 않는다(루프 방지).
function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname.startsWith("/login")) return;
  const returnUrl = encodeURIComponent(`${pathname}${search}`);
  window.location.replace(`/login?returnUrl=${returnUrl}`);
}

export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<T | null> {
  const res = await fetch(`/api/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 401) {
      if (options?.redirectOnUnauthorized !== false) redirectToLogin();
      throw new ApiError("세션이 만료되었습니다. 다시 로그인해 주세요.", 401);
    }

    const raw = await res.text().catch(() => "");
    throw new ApiError(
      extractProblemMessage(raw) ?? statusMessage(res.status),
      res.status,
    );
  }

  if (res.status === 204) return null;

  // 본문이 비어 있는 성공 응답(예: 200 + 빈 본문)도 안전하게 처리
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("응답을 해석할 수 없습니다.", res.status);
  }
}
