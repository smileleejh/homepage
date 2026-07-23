"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { extractProblemMessage } from "@/lib/api";

// 서버가 내려주는 가입 규칙 (GET /api/auth/signup-policy)
interface SignupPolicy {
  requiredLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireNonAlphanumeric: boolean;
  requiredUniqueChars: number;
  allowedEmailDomains: string[];
}

interface PasswordRule {
  label: string;
  met: boolean;
}

// 서버 정책 + 현재 입력값으로 체크리스트를 만든다.
// 판정 기준은 백엔드 Identity PasswordValidator와 동일하게 ASCII 범위로 맞춘다
// (Identity의 IsUpper/IsLower/IsDigit은 유니코드가 아니라 a-z, A-Z, 0-9만 인정한다).
function buildPasswordRules(policy: SignupPolicy, password: string): PasswordRule[] {
  const rules: PasswordRule[] = [
    {
      label: `${policy.requiredLength}자 이상`,
      met: password.length >= policy.requiredLength,
    },
  ];

  if (policy.requireUppercase) {
    rules.push({ label: "영문 대문자 포함 (A-Z)", met: /[A-Z]/.test(password) });
  }
  if (policy.requireLowercase) {
    rules.push({ label: "영문 소문자 포함 (a-z)", met: /[a-z]/.test(password) });
  }
  if (policy.requireDigit) {
    rules.push({ label: "숫자 포함 (0-9)", met: /[0-9]/.test(password) });
  }
  if (policy.requireNonAlphanumeric) {
    rules.push({
      label: "특수문자 포함 (예: ! @ # $ %)",
      met: /[^a-zA-Z0-9]/.test(password),
    });
  }
  if (policy.requiredUniqueChars > 1) {
    rules.push({
      label: `서로 다른 문자 ${policy.requiredUniqueChars}개 이상`,
      met: new Set(password).size >= policy.requiredUniqueChars,
    });
  }

  return rules;
}

// P-08 회원가입 — 커스텀 /api/auth/signup 에 연결(도메인 화이트리스트 + 이름/부서 저장). (F-AUTH-01)
export default function RegisterPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [policy, setPolicy] = useState<SignupPolicy | null>(null);

  // 가입 규칙은 서버가 source of truth — 화면에 하드코딩하지 않는다.
  // 조회 실패 시 policy는 null로 남고 체크리스트 대신 기본 안내만 노출된다.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/signup-policy")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SignupPolicy | null) => {
        if (active && data) setPolicy(data);
      })
      .catch(() => {
        // 무시 — 규칙 안내 없이도 가입 자체는 가능하고, 최종 검증은 서버가 한다
      });
    return () => {
      active = false;
    };
  }, []);

  const rules = policy ? buildPasswordRules(policy, password) : [];

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
    if (res.ok) {
      setLoading(false);
      setDone(true);
      return;
    }

    // 서버가 알려준 실패 사유(허용 도메인·중복 이메일·비밀번호 정책 등)를 그대로 보여준다.
    // 일반 문구로 뭉개면 도메인 거부를 비밀번호 문제로 오해하게 된다.
    const raw = await res.text().catch(() => "");
    setLoading(false);
    setError(
      extractProblemMessage(raw) ??
        "가입에 실패했습니다. 입력값과 비밀번호 조건을 확인하세요.",
    );
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

        {/* 허용 도메인 — 안내가 없으면 가입 실패 후에야 알게 된다 */}
        {policy && policy.allowedEmailDomains.length > 0 && (
          <p className="text-xs text-gray-500">
            가입 가능한 이메일 도메인:{" "}
            <span className="font-medium text-gray-700">
              {policy.allowedEmailDomains.map((d) => `@${d}`).join(", ")}
            </span>
          </p>
        )}

        <input
          name="password"
          type="password"
          required
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
        />

        {/* 비밀번호 조건 — 입력에 따라 충족 여부를 실시간 표시 */}
        {rules.length > 0 && (
          <ul className="space-y-1 rounded border border-gray-200 bg-gray-50 p-3">
            {rules.map((rule) => (
              <li
                key={rule.label}
                className={`flex items-center gap-2 text-xs ${
                  rule.met ? "text-green-700" : "text-gray-500"
                }`}
              >
                <span aria-hidden="true">{rule.met ? "✓" : "○"}</span>
                <span>{rule.label}</span>
                <span className="sr-only">{rule.met ? "충족" : "미충족"}</span>
              </li>
            ))}
          </ul>
        )}

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
