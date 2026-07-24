import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "이메일 인증" };

// 인증 결과별 표시 내용. 백엔드 confirm-email 이 status 쿼리로 결과를 전달한다.
// (auth) 레이아웃이 noindex를 이미 적용하므로 여기서는 제목만 지정한다.
type Status = "success" | "already" | "invalid";

const RESULTS: Record<
  Status,
  { tone: "success" | "error"; title: string; message: string; primary: { href: string; label: string } }
> = {
  success: {
    tone: "success",
    title: "이메일 인증 완료",
    message: "계정이 활성화되었습니다. 이제 로그인할 수 있습니다.",
    primary: { href: "/login", label: "로그인" },
  },
  already: {
    tone: "success",
    title: "이미 인증된 계정입니다",
    message: "이 계정은 이미 이메일 인증을 마쳤습니다. 바로 로그인하세요.",
    primary: { href: "/login", label: "로그인" },
  },
  invalid: {
    tone: "error",
    title: "인증 링크가 유효하지 않습니다",
    message:
      "링크가 만료되었거나 이미 사용되었습니다. 로그인 화면에서 인증 메일을 다시 요청해 주세요.",
    primary: { href: "/login", label: "로그인으로" },
  },
};

// P-09 이메일 인증 결과 (F-AUTH-02)
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  // 알 수 없는/누락 status는 실패로 처리한다
  const result = RESULTS[(status as Status) ?? ""] ?? RESULTS.invalid;
  const isSuccess = result.tone === "success";

  return (
    <div className="space-y-5 text-center">
      {/* 결과 아이콘 */}
      <div
        className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-white shadow-lg ${
          isSuccess
            ? "bg-linear-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30"
            : "bg-linear-to-br from-rose-500 to-red-500 shadow-rose-500/30"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden
        >
          {isSuccess ? <path d="M20 6L9 17l-5-5" /> : <path d="M18 6L6 18 M6 6l12 12" />}
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{result.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{result.message}</p>
      </div>

      <Link href={result.primary.href} className="btn btn-primary w-full">
        {result.primary.label}
      </Link>

      {!isSuccess && (
        <Link
          href="/register"
          className="inline-block text-sm text-slate-500 underline transition-colors hover:text-slate-900"
        >
          회원가입 다시 하기
        </Link>
      )}
    </div>
  );
}
