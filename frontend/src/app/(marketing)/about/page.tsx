import type { Metadata } from "next";

export const metadata: Metadata = { title: "회사소개" };

// P-02 회사 소개 (인사말/비전/연혁 — 핵심 고정 + 일부 관리자 편집 영역)
export default function AboutPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">회사 소개</h1>
      <p className="text-gray-600">
        인사말 · 비전 · 연혁 콘텐츠 영역. 일부 문구는 관리자 CMS(page_contents)로 편집됩니다.
      </p>
    </section>
  );
}
