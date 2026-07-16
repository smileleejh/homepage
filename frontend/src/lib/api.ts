// 클라이언트/서버 컴포넌트에서 BFF(/api/*)를 호출하는 얇은 래퍼.
// 인증 쿠키는 브라우저가 자동 전송하고, BFF가 백엔드로 포워딩한다.
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit,
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
    const message = await res.text();
    throw new Error(message || `요청 실패: ${res.status}`);
  }

  return res.status === 204 ? null : ((await res.json()) as T);
}
