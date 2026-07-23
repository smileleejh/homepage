"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extractProblemMessage } from "@/lib/api";

// Identity 로그인 실패 사유를 한국어 안내로 바꾼다.
// 서버는 401 ProblemDetails의 detail에 SignInResult 값("Failed"/"NotAllowed"/"LockedOut")을 담아 보낸다.
// NotAllowed는 이메일 미인증과 계정 비활성(정지)을 모두 포함한다 — 어느 쪽인지는 알려주지 않는다(계정 정보 노출 방지).
function toLoginErrorMessage(raw: string): string {
  switch (extractProblemMessage(raw)) {
    case "NotAllowed":
      return "로그인할 수 없는 계정입니다. 이메일 인증을 마쳤는지 확인하시고, 정지된 계정이라면 관리자에게 문의하세요.";
    case "LockedOut":
      return "로그인 시도 횟수를 초과해 계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도하세요.";
    case "RequiresTwoFactor":
      return "2단계 인증이 필요합니다.";
    default:
      return "로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.";
  }
}

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
    if (res.ok) {
      setLoading(false);
      const returnUrl =
        new URLSearchParams(window.location.search).get("returnUrl") ?? "/board";
      router.push(returnUrl);
      return;
    }

    const raw = await res.text().catch(() => "");
    setLoading(false);
    setError(toLoginErrorMessage(raw));
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
