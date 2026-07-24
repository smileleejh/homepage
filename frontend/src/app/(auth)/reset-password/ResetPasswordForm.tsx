"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

// P-10 비밀번호 재설정 폼 — 링크의 email·code로 새 비밀번호 설정 (/api/auth/reset-password)
export default function ResetPasswordForm() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const code = params.get("code") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 링크가 잘못된 경우(코드/이메일 누락) — 재요청 안내
  if (!email || !code) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">유효하지 않은 링크</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          재설정 링크가 올바르지 않습니다.
          <br />
          비밀번호 찾기를 다시 요청해 주세요.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-slate-500 underline transition-colors hover:text-slate-900"
        >
          비밀번호 찾기
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // 확인 일치는 서버에 보내기 전에 먼저 거른다
    if (password !== confirm) {
      setError("새 비밀번호와 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code, newPassword: password }),
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message ? err.message : "재설정에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">비밀번호가 변경되었습니다</h1>
        <p className="text-sm text-slate-600">새 비밀번호로 로그인하세요.</p>
        <Link href="/login" className="btn btn-primary">
          로그인
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
        <p className="mt-2 break-all text-sm text-slate-500">
          {email} 계정의 새 비밀번호를 설정하세요.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="password"
          autoComplete="new-password"
          required
          aria-label="새 비밀번호"
          placeholder="새 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
        <input
          type="password"
          autoComplete="new-password"
          required
          aria-label="새 비밀번호 확인"
          placeholder="새 비밀번호 확인"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field"
        />
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn btn-accent w-full">
          {loading ? "변경 중…" : "비밀번호 변경"}
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
