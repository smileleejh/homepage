import type { Metadata } from "next";
import { SITE_BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // 상대경로 OG/canonical을 절대주소로 합성하는 기준. 미설정 시 빌드 경고가 난다.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // 공개 페이지는 색인 허용. 보호 영역은 (auth) 레이아웃·robots.ts에서 별도로 막는다.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_BRAND,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
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
