"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MARKETING_NAV } from "@/lib/nav";
import { useAuthed, requestLogout } from "@/lib/auth";

// 공개 사이트 상단 내비 — 데스크톱 메뉴 + 모바일 햄버거 (로그인 상태 인식)
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [authed, setAuthed] = useAuthed();
  const router = useRouter();

  // ESC 로 모바일 메뉴 닫기
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // 로그아웃 — 홈에 머무르며 헤더 상태만 갱신
  async function handleLogout() {
    setLoggingOut(true);
    await requestLogout();
    setAuthed(false);
    setOpen(false);
    setLoggingOut(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-600/30">
            C
          </span>
          COMPANY
        </Link>

        {/* 데스크톱 메뉴 */}
        <div className="hidden items-center gap-8 md:flex">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </div>

        {/* 데스크톱 우측 액션 — 로그인 상태에 따라 전환 */}
        <div className="hidden items-center gap-3 md:flex">
          {authed ? (
            <>
              <Link href="/board" className="btn btn-primary px-5! py-2!">
                게시판
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="btn btn-outline px-4! py-2!"
              >
                {loggingOut ? "로그아웃 중…" : "로그아웃"}
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary px-5! py-2!">
              로그인
            </Link>
          )}
        </div>

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
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
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* 모바일 메뉴 패널 */}
      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-6 py-4">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}

            {authed ? (
              <>
                <Link
                  href="/board"
                  onClick={() => setOpen(false)}
                  className="btn btn-primary mt-3 w-full"
                >
                  게시판
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="btn btn-outline mt-2 w-full"
                >
                  {loggingOut ? "로그아웃 중…" : "로그아웃"}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn btn-primary mt-3 w-full"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
