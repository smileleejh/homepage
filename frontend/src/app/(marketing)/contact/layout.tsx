import type { Metadata } from "next";

// 문의 페이지(P-05)는 폼 상태를 다루는 클라이언트 컴포넌트라 metadata를 export할 수 없다.
// 세그먼트 레이아웃에서 대신 메타데이터를 지정한다.
export const metadata: Metadata = {
  title: "문의하기",
  description: "궁금한 점을 남겨 주시면 담당자가 빠르게 회신드립니다. 온라인 문의 폼으로 접수하세요.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "문의하기", url: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
