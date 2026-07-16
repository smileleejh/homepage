import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "이메일 인증" };

// P-09 이메일 인증 결과 (Identity confirmEmail 링크 처리 결과 안내)
export default function VerifyEmailPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">이메일 인증</h1>
      <p className="text-sm text-gray-600">
        인증 링크 처리 결과가 이곳에 표시됩니다.
      </p>
      <Link href="/login" className="text-sm underline">
        로그인으로
      </Link>
    </>
  );
}
