import type { Metadata } from "next";

export const metadata: Metadata = { title: "오시는 길" };

// P-04 오시는 길
export default function LocationPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">오시는 길</h1>
      <p className="text-gray-600">주소 · 지도 · 연락처 영역.</p>
    </section>
  );
}
