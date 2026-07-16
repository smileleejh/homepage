import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "문의 완료" };

// P-06 문의 완료
export default function ContactCompletePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">문의가 접수되었습니다</h1>
      <p className="text-gray-600">
        담당자가 확인 후 회신드리겠습니다. 감사합니다.
      </p>
      <Link href="/" className="text-sm underline">
        홈으로 돌아가기
      </Link>
    </section>
  );
}
