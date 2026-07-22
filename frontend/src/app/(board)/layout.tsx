import BoardHeader from "./_components/BoardHeader";

// 직원 영역 공통 셸 (로그인 필요 — 실제 인가는 백엔드, 라우트 가드는 proxy.ts)
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <BoardHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
