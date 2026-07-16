import Link from "next/link";

// 관리자 영역 공통 셸 (사이드바 — admin 역할만, 인가는 백엔드가 강제)
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <aside className="w-56 shrink-0 border-r p-4 text-sm">
        <p className="mb-4 font-bold">관리자</p>
        <nav className="flex flex-col gap-2">
          <Link href="/admin">대시보드</Link>
          <Link href="/admin/inquiries">문의 관리</Link>
          <Link href="/admin/members">회원 관리</Link>
          <Link href="/admin/categories">카테고리 관리</Link>
          <Link href="/admin/posts">게시글·댓글</Link>
          <Link href="/admin/content">콘텐츠 편집</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
