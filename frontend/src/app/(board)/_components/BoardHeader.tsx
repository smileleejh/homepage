"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BOARD_CATEGORIES } from "@/lib/board";
import { requestLogout, useIsAdmin } from "@/lib/auth";
import { useCategoryCounts } from "./useCategoryCounts";

// 직원 영역 상단 내비 — 게시판 하위 카테고리 드롭다운 + 로그아웃 + 모바일 햄버거
export default function BoardHeader() {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false); // 데스크톱 게시판 드롭다운
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 메뉴 패널
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const counts = useCategoryCounts();
  const isAdmin = useIsAdmin();

  // 바깥 클릭 / ESC 로 드롭다운·모바일 메뉴 닫기
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // 로그아웃 — 커스텀 엔드포인트(POST /api/auth/logout)로 세션 쿠키 만료
  async function handleLogout() {
    setLoggingOut(true);
    await requestLogout();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link
            href="/board"
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-600/30">
              C
            </span>
            COMPANY
            <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 sm:inline">
              사내 게시판
            </span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden items-center gap-6 md:flex">
            {/* 게시판 드롭다운 — 하위 카테고리 바로 접근 */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setOpenMenu((v) => !v)}
                aria-expanded={openMenu}
                aria-haspopup="menu"
                className="nav-link flex items-center gap-1"
              >
                게시판
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    openMenu ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {openMenu && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/70"
                >
                  <Link
                    href="/board"
                    role="menuitem"
                    onClick={() => setOpenMenu(false)}
                    className="flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    전체 게시판
                  </Link>
                  <div className="my-1 h-px bg-slate-100" />
                  {BOARD_CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/board/${c.slug}`}
                      role="menuitem"
                      onClick={() => setOpenMenu(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <span>{c.name}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-400">
                        {counts?.[c.slug] ?? 0}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/me" className="nav-link">
              내 프로필
            </Link>
            {/* 관리자에게만 노출 */}
            {isAdmin && (
              <Link
                href="/admin"
                className="nav-link flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 2l7 4v6c0 4.4-3 8-7 10-4-2-7-5.6-7-10V6z" />
                </svg>
                관리자
              </Link>
            )}
          </div>
        </div>

        {/* 데스크톱 우측 액션 */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/" className="btn btn-outline px-4! py-2!">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
            홈으로
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn btn-primary px-4! py-2!"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {loggingOut ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={mobileOpen}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* 모바일 메뉴 패널 */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
            <Link
              href="/board"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-50"
            >
              전체 게시판
            </Link>
            {BOARD_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/board/${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-lg py-2.5 pl-6 pr-3 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <span>{c.name}</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-400">
                  {counts?.[c.slug] ?? 0}
                </span>
              </Link>
            ))}

            <Link
              href="/me"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              내 프로필
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
              >
                관리자
              </Link>
            )}

            <div className="my-2 h-px bg-slate-100" />

            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="btn btn-outline w-full"
            >
              홈으로
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-primary mt-2 w-full"
            >
              {loggingOut ? "로그아웃 중…" : "로그아웃"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
