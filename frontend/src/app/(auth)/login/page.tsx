"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// P-07 로그인 — Identity 쿠키 로그인(/api/auth/login?useCookies=true) (F-AUTH-03)
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login?useCookies=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setLoading(false);

    if (res.ok) {
      const returnUrl =
        new URLSearchParams(window.location.search).get("returnUrl") ?? "/board";
      router.push(returnUrl);
    } else {
      setError("로그인에 실패했습니다. 이메일 인증 여부와 자격 증명을 확인하세요.");
    }
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-slate-500">직원 계정으로 로그인하세요.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          placeholder="회사 이메일"
          className="field"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="비밀번호"
          className="field"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn btn-accent w-full">
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>

      <div className="flex justify-between text-sm">
        <Link href="/register" className="text-slate-500 transition-colors hover:text-slate-900">
          회원가입
        </Link>
        <Link
          href="/forgot-password"
          className="text-slate-500 transition-colors hover:text-slate-900"
        >
          비밀번호 찾기
        </Link>
      </div>
    </>
  );
}
