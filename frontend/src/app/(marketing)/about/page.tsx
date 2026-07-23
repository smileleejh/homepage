import type { Metadata } from "next";
import { getContent } from "@/lib/content";

export const metadata: Metadata = { title: "회사소개" };

// ISR: 60초마다 재생성하여 관리자 CMS 편집(인사말)을 반영
export const revalidate = 60;

// P-02 회사 소개 (인사말/비전/연혁 — 핵심 고정 + 일부 관리자 편집 영역)
export default async function AboutPage() {
  // 관리자 편집 영역(CMS): 인사말. 실패 시 기본 문구로 폴백.
  const greeting = await getContent("greeting");
  const blocks = [
    {
      label: (greeting?.isVisible && greeting.title) || "인사말",
      text:
        (greeting?.isVisible && greeting.body) ||
        "고객과 함께 성장해 온 시간을 바탕으로, 더 나은 가치를 만들어 갑니다.",
    },
    {
      label: "비전 · 미션",
      text: "기술과 신뢰를 기반으로 산업의 기준을 새롭게 정의합니다.",
    },
    {
      label: "연혁",
      text: "설립 이래 꾸준한 성장을 이어오며 업계의 신뢰를 쌓아왔습니다.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <span className="eyebrow">About us</span>
      <h1 className="mt-3 text-4xl font-bold">회사 소개</h1>
      <div className="mt-5 h-1 w-12 rounded-full bg-linear-to-r from-indigo-600 to-violet-600" />
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
        고객과 함께 걸어온 길, 그리고 앞으로 만들어 갈 가치를 소개합니다.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {blocks.map((b) => (
          <div key={b.label} className="card">
            <span className="eyebrow">{b.label}</span>
            <p className="mt-3 leading-relaxed text-slate-600">{b.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
