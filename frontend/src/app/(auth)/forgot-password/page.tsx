import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "비밀번호 찾기" };

// P-10 비밀번호 재설정 요청 (F-AUTH-05)
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
