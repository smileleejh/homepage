"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

// P-05 문의하기 — BFF(/api/inquiries)로 제출 (F-INQ-01)
export default function ContactPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await apiFetch("inquiries", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          company: form.get("company"),
          phone: form.get("phone"),
          title: form.get("title"),
          message: form.get("message"),
          privacyConsent: form.get("privacyConsent") === "on",
        }),
      });
      router.push("/contact/complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <div className="text-center">
        <span className="eyebrow">Contact</span>
        <h1 className="mt-3 text-4xl font-bold">문의하기</h1>
        <div className="mx-auto mt-5 h-1 w-12 rounded-full bg-linear-to-r from-indigo-600 to-violet-600" />
        <p className="mt-6 text-slate-600">
          궁금한 점을 남겨 주시면 담당자가 빠르게 회신드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card mt-10 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="name" required placeholder="이름 *" className="field" />
          <input
            name="email"
            type="email"
            required
            placeholder="이메일 *"
            className="field"
          />
          <input name="company" placeholder="회사명 (선택)" className="field" />
          <input name="phone" placeholder="연락처 (선택)" className="field" />
        </div>
        <input name="title" required placeholder="제목 *" className="field" />
        <textarea
          name="message"
          required
          placeholder="문의 내용 *"
          rows={5}
          className="field resize-none"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            name="privacyConsent"
            type="checkbox"
            required
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          개인정보 수집·이용에 동의합니다.
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-accent w-full"
        >
          {submitting ? "제출 중…" : "문의 제출"}
        </button>
      </form>
    </div>
  );
}
