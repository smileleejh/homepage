import type { Metadata } from "next";
import Link from "next/link";

// 접수 결과 페이지는 색인 대상이 아니다(문의를 넣어야 도달하는 확인 페이지)
export const metadata: Metadata = {
  title: "문의 완료",
  robots: { index: false, follow: true },
};

// P-06 문의 완료
export default function ContactCompletePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
      {/* 성공 체크 아이콘 */}
      <div className="grid h-16 w-16 place-items-center rounded-full bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="mt-6 text-3xl font-bold">문의가 접수되었습니다</h1>
      <p className="mt-4 leading-relaxed text-slate-600">
        담당자가 확인 후 회신드리겠습니다. 감사합니다.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
