import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "비밀번호 재설정" };

// P-10 비밀번호 재설정 (F-AUTH-05)
// 폼은 useSearchParams(email·code)를 읽는 클라이언트 컴포넌트라 Suspense로 감싼다.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-sm text-slate-500">불러오는 중…</p>}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
