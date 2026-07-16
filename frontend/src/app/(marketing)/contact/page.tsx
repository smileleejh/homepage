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
    <section className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">문의하기</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" required placeholder="이름" className="w-full rounded border p-2" />
        <input name="email" type="email" required placeholder="이메일" className="w-full rounded border p-2" />
        <input name="company" placeholder="회사명(선택)" className="w-full rounded border p-2" />
        <input name="phone" placeholder="연락처(선택)" className="w-full rounded border p-2" />
        <input name="title" required placeholder="제목" className="w-full rounded border p-2" />
        <textarea name="message" required placeholder="문의 내용" rows={5} className="w-full rounded border p-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="privacyConsent" type="checkbox" required />
          개인정보 수집·이용에 동의합니다.
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "제출 중…" : "문의 제출"}
        </button>
      </form>
    </section>
  );
}
