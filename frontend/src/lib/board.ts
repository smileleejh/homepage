// 사내 게시판 카테고리 (slug·이름·설명은 프론트 고정, 게시물 수는 API에서 조회)
export interface BoardCategory {
  slug: string;
  name: string;
  desc: string;
}

export const BOARD_CATEGORIES: BoardCategory[] = [
  { slug: "notice", name: "공지사항", desc: "회사 전체 공지와 안내" },
  { slug: "free", name: "자유게시판", desc: "직원 간 자유로운 소통" },
  { slug: "resource", name: "업무자료", desc: "문서·템플릿·참고 자료" },
  { slug: "team", name: "팀 소식", desc: "팀별 소식과 일정 공유" },
];

// 백엔드 GET /api/categories 응답 (게시물 수 포함)
export interface CategoryWithCount {
  slug: string;
  name: string;
  count: number;
}
