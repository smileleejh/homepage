import Link from "next/link";
import AdminSidebar from "./_components/AdminSidebar";

// 관리자 영역 공통 셸 (사이드바 — admin 역할만, 최종 인가는 백엔드가 강제)
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      {/* 상단 바 */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-600/30">
              C
            </span>
            COMPANY
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
              관리자
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/board" className="btn btn-outline px-4! py-2!">
              게시판
            </Link>
            <Link href="/" className="btn btn-outline px-4! py-2!">
              홈으로
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 md:flex-row">
        {/* 사이드바 (모바일: 가로 스크롤 / 데스크톱: 세로) */}
        <aside className="shrink-0 md:w-56">
          <div className="md:sticky md:top-24">
            <AdminSidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
