import type { Metadata } from "next";

export const metadata: Metadata = { title: "비밀번호 찾기" };

// P-10 비밀번호 재설정 요청 (/api/auth/forgotPassword)
export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
      <p className="text-sm text-gray-600">
        가입 이메일로 재설정 링크를 보내는 폼 영역.
      </p>
    </>
  );
}
