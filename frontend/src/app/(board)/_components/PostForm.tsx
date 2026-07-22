"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { BOARD_CATEGORIES } from "@/lib/board";

// 게시글 작성/수정 공용 폼
export default function PostForm({
  mode,
  postId,
  initialCategory = "",
  initialTitle = "",
  initialBody = "",
}: {
  mode: "create" | "edit";
  postId?: number;
  initialCategory?: string;
  initialTitle?: string;
  initialBody?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = mode === "edit";
  const cancelHref =
    isEdit && postId != null ? `/board/${initialCategory}/${postId}` : "/board";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const categorySlug = String(form.get("categorySlug") ?? "");
    const payload = JSON.stringify({
      categorySlug,
      title: form.get("title"),
      body: form.get("body"),
    });
    try {
      if (isEdit && postId != null) {
        await apiFetch(`posts/${postId}`, { method: "PUT", body: payload });
        router.push(`/board/${categorySlug}/${postId}`);
        router.refresh();
      } else {
        const created = await apiFetch<{ id: number; category: string }>("posts", {
          method: "POST",
          body: payload,
        });
        if (created) {
          router.push(`/board/${created.category}/${created.id}`);
        } else {
          router.push(`/board/${categorySlug}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/board" className="transition-colors hover:text-slate-900">
          게시판
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{isEdit ? "글 수정" : "글쓰기"}</span>
      </nav>

      <h1 className="text-3xl font-bold">{isEdit ? "글 수정" : "글쓰기"}</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <select name="categorySlug" required className="field" defaultValue={initialCategory}>
            <option value="" disabled>
              카테고리 선택
            </option>
            {BOARD_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="title"
            required
            placeholder="제목을 입력하세요"
            defaultValue={initialTitle}
            className="field"
          />
        </div>

        <textarea
          name="body"
          required
          placeholder="본문을 입력하세요"
          rows={12}
          defaultValue={initialBody}
          className="field resize-none"
        />

        {!isEdit && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-400">
              파일 첨부 <span className="font-normal">(준비 중)</span>
            </label>
            <input
              type="file"
              multiple
              disabled
              className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-500"
            />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href={cancelHref} className="btn btn-outline px-5! py-2.5!">
            취소
          </Link>
          <button type="submit" disabled={submitting} className="btn btn-accent px-6! py-2.5!">
            {submitting ? "저장 중…" : isEdit ? "수정 완료" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
