import Link from "next/link";
import SiteHeader from "./_components/SiteHeader";
import { MARKETING_NAV } from "@/lib/nav";

// 공개 영역 공통 셸 (GNB + 푸터)
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className="flex-1">{children}</main>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-xs font-black text-white">
                C
              </span>
              COMPANY
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              신뢰할 수 있는 비즈니스 파트너.
              <br />
              공개 소개 · 고객 문의 · 사내 협업.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">바로가기</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {MARKETING_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-slate-900">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">계정</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/login" className="transition-colors hover:text-slate-900">
                  로그인
                </Link>
              </li>
              <li>
                <Link href="/register" className="transition-colors hover:text-slate-900">
                  회원가입
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">문의</h4>
            <p className="text-sm text-slate-500">
              평일 09:00 – 18:00
              <br />
              contact@company.com
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <p className="mx-auto max-w-6xl px-6 py-5 text-center text-xs text-slate-400">
            © COMPANY. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
