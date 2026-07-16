"use client";

import { useState } from "react";
import Link from "next/link";

// P-08 회원가입 — 커스텀 /api/auth/signup 에 연결(도메인 화이트리스트 + 이름/부서 저장). (F-AUTH-01)
export default function RegisterPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        name: form.get("name"),
        department: form.get("department"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError("가입에 실패했습니다. 이메일 형식과 비밀번호 정책(8자 이상)을 확인하세요.");
    }
  }

  if (done) {
    return (
      <>
        <h1 className="text-2xl font-bold">가입 신청 완료</h1>
        <p className="text-sm text-gray-600">
          입력하신 이메일로 인증 링크를 보냈습니다(개발 환경에서는 서버 로그에 출력).
          인증 후 로그인할 수 있습니다.
        </p>
        <Link href="/login" className="text-sm underline">
          로그인으로
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold">회원가입</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="name" placeholder="이름" className="w-full rounded border p-2" />
        <input name="department" placeholder="부서(선택)" className="w-full rounded border p-2" />
        <input name="email" type="email" required placeholder="회사 이메일" className="w-full rounded border p-2" />
        <input name="password" type="password" required placeholder="비밀번호(8자 이상)" className="w-full rounded border p-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "처리 중…" : "가입 신청"}
        </button>
      </form>
      <Link href="/login" className="text-sm text-gray-500">
        이미 계정이 있으신가요? 로그인
      </Link>
    </>
  );
}
