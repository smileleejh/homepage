"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 관리자 메뉴 항목
export const ADMIN_NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/inquiries", label: "문의 관리" },
  { href: "/admin/members", label: "회원 관리" },
  { href: "/admin/categories", label: "카테고리 관리" },
  { href: "/admin/posts", label: "게시글·댓글" },
  { href: "/admin/content", label: "콘텐츠 편집" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ADMIN_NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
