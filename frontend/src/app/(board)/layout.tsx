import Link from "next/link";

// 직원 영역 공통 셸 (로그인 필요 — 실제 인가는 백엔드, 라우트 가드는 proxy.ts)
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-gray-50">
        <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link href="/board" className="font-bold">
            사내 게시판
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/board">게시판</Link>
            <Link href="/me">내 프로필</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
    </div>
  );
}
