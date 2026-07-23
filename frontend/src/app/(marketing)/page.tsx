import Link from "next/link";
import AuthedCta from "./_components/AuthedCta";
import HeroCarousel from "./_components/HeroCarousel";
import { getContent } from "@/lib/content";

// ISR: 60초마다 재생성하여 관리자 CMS 편집(배너·공지)을 반영
export const revalidate = 60;

// P-01 메인/홈 — 배경 이미지 히어로 + 특징 섹션 + CTA 밴드
export default async function HomePage() {
  // 관리자 편집 영역(CMS): 메인 배너 문구 + 홈 공지. 실패 시 기본 문구로 폴백.
  const [banner, notice] = await Promise.all([
    getContent("main_banner"),
    getContent("notice"),
  ]);
  const heroText =
    (banner?.isVisible && banner.body) ||
    "회사 소개부터 고객 문의, 직원 전용 사내 협업까지 — 신뢰할 수 있는 하나의 플랫폼에서 시작하세요.";
  // 공지는 노출 플래그가 켜지고 본문이 있을 때만 배너로 노출
  const showNotice = Boolean(notice?.isVisible && notice.body?.trim());

  // 특징 카드 데이터 (아이콘은 인라인 SVG)
  const features = [
    {
      title: "공개 소개 사이트",
      desc: "SSR/SSG 기반의 빠르고 SEO 친화적인 회사 소개 페이지를 제공합니다.",
      icon: (
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />
      ),
    },
    {
      title: "고객 문의 관리",
      desc: "문의 접수부터 상태 관리·담당자 배정·이메일 알림까지 한 번에 처리합니다.",
      icon: (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      ),
    },
    {
      title: "직원 전용 게시판",
      desc: "게시글·댓글·첨부·카테고리·공지 고정까지 갖춘 사내 협업 공간입니다.",
      icon: (
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5" />
      ),
    },
  ];

  return (
    <>
      {/* ===== 공지 배너 (CMS: notice — 노출 플래그 ON + 본문 있을 때만) ===== */}
      {showNotice && (
        <div className="bg-linear-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-white">
          <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 text-center text-sm font-medium">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0"
              aria-hidden
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notice?.body}
          </p>
        </div>
      )}

      {/* ===== 히어로 캐러셀 (스와이프·자동전환) ===== */}
      <HeroCarousel bannerText={heroText} />

      {/* ===== 특징 섹션 ===== */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">What we offer</span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">맞춤형 서비스</h2>
          <div className="mx-auto mt-5 h-1 w-12 rounded-full bg-linear-to-r from-indigo-600 to-violet-600" />
          <p className="mt-6 text-slate-600">
            공개 사이트, 고객 문의 관리, 사내 게시판까지 — 필요한 기능을 하나로.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card group">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA 밴드 ===== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-indigo-950 to-violet-950 px-8 py-16 text-center shadow-2xl shadow-indigo-950/30 sm:px-16">
          {/* 은은한 광원 효과 */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              지금 바로 시작해 보세요
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              궁금한 점이 있으신가요? 문의를 남겨 주시면 담당자가 빠르게 회신드립니다.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn btn-accent">
                문의 남기기
              </Link>
              <AuthedCta />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
