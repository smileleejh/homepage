"use client";

import { useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// P-10 비밀번호 찾기 폼 — 가입 이메일로 재설정 링크 요청 (/api/auth/forgot-password)
export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email") }),
      });
      // 서버는 계정 존재 여부와 무관하게 200을 준다 — 성공 화면도 중립적으로 안내한다
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : "요청에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">이메일을 확인하세요</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          입력하신 이메일이 가입되어 있다면 비밀번호 재설정 링크를 보냈습니다.
          <br />
          메일이 보이지 않으면 스팸함도 확인해 주세요.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-slate-500 underline transition-colors hover:text-slate-900"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-slate-500">
          가입한 회사 이메일로 재설정 링크를 보내드립니다.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="email"
          type="email"
          required
          aria-label="회사 이메일"
          autoComplete="email"
          placeholder="회사 이메일"
          className="field"
        />
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn btn-accent w-full">
          {loading ? "전송 중…" : "재설정 링크 받기"}
        </button>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-slate-500 transition-colors hover:text-slate-900">
          로그인으로
        </Link>
      </div>
    </>
  );
}
