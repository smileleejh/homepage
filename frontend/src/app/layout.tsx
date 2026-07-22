import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "회사 홈페이지",
    template: "%s | 회사 홈페이지",
  },
  description: "회사 소개 · 문의 접수 · 직원 전용 사내 게시판",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: 브라우저 확장(data-hwp-extension 등)이 <html>에
    // 속성을 주입해 생기는 하이드레이션 불일치 경고를 억제 (실제 앱 버그와 무관)
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {/* 모던 한글 폰트 Pretendard (React 19가 <head>로 호이스팅) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-dynamic-subset.min.css"
          precedence="default"
        />
        {children}
      </body>
    </html>
  );
}
