"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type CommentItem = {
  id: number;
  body: string;
  authorName: string;
  canDelete: boolean;
  createdAt: string;
};

export default function CommentSection({ postId }: { postId: string }) {
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 인라인 수정 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // 목록 로드 (초기 + 작성/수정/삭제 후 재조회)
  async function load() {
    try {
      const data = await apiFetch<CommentItem[]>(`posts/${postId}/comments`);
      setComments(data ?? []);
      setError(null);
    } catch {
      setError("댓글을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    let active = true;
    apiFetch<CommentItem[]>(`posts/${postId}/comments`)
      .then((data) => {
        if (active) setComments(data ?? []);
      })
      .catch(() => {
        if (active) setError("댓글을 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [postId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setBody("");
      await load();
    } catch {
      window.alert("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(c: CommentItem) {
    setEditingId(c.id);
    setEditBody(c.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
  }

  async function saveEdit(id: number) {
    if (!editBody.trim()) return;
    setSavingEdit(true);
    try {
      await apiFetch(`comments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ body: editBody }),
      });
      setEditingId(null);
      setEditBody("");
      await load();
    } catch {
      window.alert("댓글 수정에 실패했습니다.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await apiFetch(`comments/${id}`, { method: "DELETE" });
      await load();
    } catch {
      window.alert("삭제에 실패했습니다. 권한을 확인하세요.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-lg font-bold">
        댓글 <span className="text-slate-400">{comments?.length ?? 0}</span>
      </h2>

      {/* 작성 폼 */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="field"
        />
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="btn btn-accent shrink-0 px-5! py-2.5!"
        >
          {submitting ? "등록 중…" : "등록"}
        </button>
      </form>

      {/* 목록 */}
      {error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : comments === null ? (
        <p className="mt-6 text-sm text-slate-400">불러오는 중…</p>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-sm text-slate-400">아직 댓글이 없습니다.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100">
          {comments.map((c) => (
            <li key={c.id} className="py-4 first:pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-900">{c.authorName}</span>
                  <span className="text-slate-400">{c.createdAt.slice(0, 10)}</span>
                </div>
                {c.canDelete && editingId !== c.id && (
                  <div className="flex gap-3 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-slate-500 transition-colors hover:text-slate-900"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-red-500 transition-colors hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {editingId === c.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="field"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(c.id)}
                    disabled={savingEdit || !editBody.trim()}
                    className="btn btn-accent shrink-0 px-4! py-2!"
                  >
                    {savingEdit ? "저장 중…" : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn btn-outline shrink-0 px-4! py-2!"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {c.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
