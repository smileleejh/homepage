import Link from "next/link";

// E-01 게시판 홈 (카테고리/최근 글, 공지 고정)
export default function BoardHomePage() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">사내 게시판</h1>
        <Link href="/board/new" className="rounded bg-black px-3 py-1.5 text-sm text-white">
          글쓰기
        </Link>
      </div>
      <p className="text-gray-600">카테고리 목록 · 최근 글 · 공지 고정 영역.</p>
    </section>
  );
}
