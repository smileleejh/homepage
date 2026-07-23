"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// 메인 히어로 캐러셀 — 스와이프·자동전환·도트·화살표·키보드 지원.
// 1번 슬라이드 문구는 CMS(main_banner)로 주입, 배경은 사진; 2·3번은 그라디언트.
type Cta = { href: string; label: string; variant: "accent" | "glass"; arrow?: boolean };
type Slide = {
  eyebrow: string;
  titleLines: [string, string];
  subtitle: string | null; // null이면 CMS main_banner 문구 사용
  ctas: Cta[];
  image?: string;
  gradient?: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Business Solutions",
    titleLines: ["비즈니스의 성장을", "함께 만드는 파트너"],
    subtitle: null,
    ctas: [
      { href: "/contact", label: "문의하기", variant: "accent", arrow: true },
      { href: "/about", label: "회사 소개 보기", variant: "glass" },
    ],
    image: "/hero.jpg",
  },
  {
    eyebrow: "Customer Support",
    titleLines: ["문의부터 응대까지", "놓치지 않는 관리"],
    subtitle: "문의 접수·상태 관리·담당자 배정·이메일 알림을 한곳에서 처리하세요.",
    ctas: [
      { href: "/contact", label: "문의하기", variant: "accent", arrow: true },
      { href: "/services", label: "서비스 보기", variant: "glass" },
    ],
    image: "/hero-2.svg",
  },
  {
    eyebrow: "Team Collaboration",
    titleLines: ["직원이 모이는", "사내 협업 공간"],
    subtitle: "게시글·댓글·첨부·공지 고정까지, 팀의 소통을 한곳에 모읍니다.",
    ctas: [
      { href: "/board", label: "게시판 바로가기", variant: "accent", arrow: true },
      { href: "/login", label: "로그인", variant: "glass" },
    ],
    image: "/hero-3.svg",
  },
];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 60; // 슬라이드 전환에 필요한 최소 드래그(px)

// 감속 모션 선호 여부 (자동 전환 비활성화용) — effect 내 동기 setState 없이 구독
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export default function HeroCarousel({ bannerText }: { bannerText: string }) {
  const [current, setCurrent] = useState(0);
  const [drag, setDrag] = useState(0); // 진행 중인 드래그 오프셋(px)
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const startX = useRef<number | null>(null);
  const moved = useRef(false); // 드래그 여부(클릭 억제용)
  const reduced = usePrefersReducedMotion();

  const last = SLIDES.length - 1;
  const go = useCallback((i: number) => setCurrent((i + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);

  // 자동 전환 — 마우스 오버/드래그/감속모션 시 일시정지
  useEffect(() => {
    if (hovering || dragging || reduced) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [hovering, dragging, reduced, current, next]);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 8) moved.current = true;
    setDrag(dx);
  }
  function endDrag() {
    if (startX.current === null) return;
    if (drag < -SWIPE_THRESHOLD && current < last) setCurrent(current + 1);
    else if (drag > SWIPE_THRESHOLD && current > 0) setCurrent(current - 1);
    startX.current = null;
    setDrag(0);
    setDragging(false);
  }
  // 드래그 직후 발생하는 CTA 클릭(원치 않는 이동) 억제
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  // 양 끝에서 드래그 저항(러버밴드)
  const dx =
    (current === 0 && drag > 0) || (current === last && drag < 0) ? drag * 0.35 : drag;

  return (
    <section
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-roledescription="carousel"
      aria-label="메인 배너"
    >
      {/* 슬라이드 트랙 */}
      <div
        className={`flex touch-pan-y select-none ${dragging ? "cursor-grabbing" : "cursor-grab"} ${
          dragging ? "" : "transition-transform duration-700 ease-out"
        }`}
        style={{ transform: `translateX(calc(${current * -100}% + ${dx}px))` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="relative w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-hidden={i !== current}
          >
            {/* 배경 (사진 또는 그라디언트) */}
            {slide.image ? (
              <div
                className="absolute inset-0 scale-105 bg-cover bg-center"
                style={{ backgroundImage: `url('${slide.image}')` }}
              />
            ) : (
              <div className={`absolute inset-0 ${slide.gradient}`} />
            )}
            {/* 가독성 오버레이 */}
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-900/70 to-slate-900/25" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent" />

            {/* 콘텐츠 */}
            <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 py-24">
              <span className="eyebrow text-indigo-300">{slide.eyebrow}</span>
              <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.15] text-white sm:text-5xl lg:text-6xl">
                {slide.titleLines[0]}
                <br />
                {slide.titleLines[1]}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">
                {slide.subtitle ?? bannerText}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {slide.ctas.map((cta) => (
                  <Link
                    key={cta.href + cta.label}
                    href={cta.href}
                    tabIndex={i === current ? undefined : -1}
                    className={`btn ${cta.variant === "accent" ? "btn-accent" : "btn-glass"}`}
                  >
                    {cta.label}
                    {cta.arrow && <span aria-hidden>→</span>}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 좌우 화살표 (데스크톱) */}
      <button
        type="button"
        onClick={() => go(current - 1)}
        aria-label="이전 슬라이드"
        className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:grid"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(current + 1)}
        aria-label="다음 슬라이드"
        className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:grid"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* 도트 내비 */}
      <div className="absolute inset-x-0 bottom-10">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${i + 1}번 슬라이드로 이동`}
              aria-current={i === current}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
