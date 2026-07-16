import type { Metadata } from "next";

export const metadata: Metadata = { title: "사업분야" };

// P-03 사업분야/서비스
export default function ServicesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">사업분야</h1>
      <p className="text-gray-600">제공 제품 · 서비스 소개 영역.</p>
    </section>
  );
}
