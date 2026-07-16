import type { Metadata } from "next";

export const metadata: Metadata = { title: "비밀번호 재설정" };

// P-10 비밀번호 재설정 (/api/auth/resetPassword)
export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
      <p className="text-sm text-gray-600">새 비밀번호 입력 폼 영역.</p>
    </>
  );
}
