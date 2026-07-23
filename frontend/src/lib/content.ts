// 공개 페이지(서버 컴포넌트)에서 사용하는 CMS 콘텐츠 헬퍼.
// 백엔드 GET /api/content/{key}(공개)를 서버에서 직접 조회한다.
// - 실패/미존재 시 null을 반환해 호출부가 기본 문구로 폴백한다(백엔드 미가동 시에도 페이지가 깨지지 않음).
// - next.revalidate로 ISR 재검증하여 관리자 편집이 일정 주기로 반영된다. (F-INT-02 하이브리드 CMS)
const BACKEND = process.env.BACKEND_API_URL ?? "http://localhost:5259";

export interface PageContent {
  key: string;
  title: string | null;
  body: string;
  isVisible: boolean;
  updatedAt: string;
}

export async function getContent(
  key: string,
  revalidateSeconds = 60,
): Promise<PageContent | null> {
  try {
    const res = await fetch(`${BACKEND}/api/content/${encodeURIComponent(key)}`, {
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return (await res.json()) as PageContent;
  } catch {
    return null; // 백엔드 미가동/네트워크 오류 — 호출부 기본값 사용
  }
}
