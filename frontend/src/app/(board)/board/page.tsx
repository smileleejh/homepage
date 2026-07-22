import Link from "next/link";
import BoardCategoryGrid from "../_components/BoardCategoryGrid";

// E-01 게시판 홈 (카테고리/최근 글, 공지 고정)
export default function BoardHomePage() {
  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Employee</span>
          <h1 className="mt-2 text-3xl font-bold">사내 게시판</h1>
          <p className="mt-2 text-slate-600">카테고리 목록 · 최근 글 · 공지 고정 영역입니다.</p>
        </div>
        <Link href="/board/new" className="btn btn-accent px-5! py-2.5!">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          글쓰기
        </Link>
      </div>

      {/* 공지 고정 */}
      <Link
        href="/board/notice"
        className="card block border-l-4 border-l-indigo-500"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
            공지
          </span>
          <div>
            <h3 className="font-bold text-slate-900">
              사내 게시판 이용 안내 및 커뮤니티 가이드
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              게시판 사용 규칙과 카테고리 안내를 확인해 주세요.
            </p>
          </div>
        </div>
      </Link>

      {/* 카테고리 그리드 */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          카테고리
        </h2>
        <BoardCategoryGrid />
      </div>
    </div>
  );
}
