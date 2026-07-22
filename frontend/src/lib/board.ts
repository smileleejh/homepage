// 사내 게시판 카테고리.
// 이름·설명(및 slug)은 설정 파일 src/config/board-categories.json 에서 관리한다.
// slug 는 백엔드 시드(DbSeeder)의 카테고리 slug 와 반드시 일치해야 한다.
import boardCategoriesConfig from "@/config/board-categories.json";

export interface BoardCategory {
  slug: string;
  name: string;
  desc: string;
}

export const BOARD_CATEGORIES: BoardCategory[] = boardCategoriesConfig;

// 백엔드 GET /api/categories 응답 (게시물 수 포함)
export interface CategoryWithCount {
  slug: string;
  name: string;
  count: number;
}
