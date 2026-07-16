import Link from "next/link";

// 공개 영역 공통 셸 (GNB + 푸터)
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link href="/" className="font-bold">
            회사 로고
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/about">회사소개</Link>
            <Link href="/services">사업분야</Link>
            <Link href="/location">오시는 길</Link>
            <Link href="/contact">문의하기</Link>
            <Link href="/login" className="font-medium">
              로그인
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6">{children}</main>
      <footer className="border-t p-4 text-center text-xs text-gray-500">
        © 회사명. All rights reserved.
      </footer>
    </div>
  );
}
