// P-01 메인/홈
export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">회사 소개 홈페이지</h1>
        <p className="text-gray-600">
          공개 소개 · 고객 문의 접수 · 직원 전용 사내 게시판을 제공합니다.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href="/contact"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          문의하기
        </a>
        <a href="/about" className="rounded border px-4 py-2 text-sm">
          회사 소개 보기
        </a>
      </div>
    </section>
  );
}
