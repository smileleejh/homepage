"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// A-05 게시판 카테고리 관리 (생성/수정/정렬/삭제)
type Category = {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  postCount: number;
  createdAt: string;
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 생성 폼
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [creating, setCreating] = useState(false);

  // 인라인 수정
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSort, setEditSort] = useState("");

  async function load() {
    try {
      const d = await apiFetch<Category[]>("admin/categories");
      setItems(d ?? []);
      setError(null);
    } catch {
      setError("카테고리를 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    let active = true;
    apiFetch<Category[]>("admin/categories")
      .then((d) => {
        if (active) setItems(d ?? []);
      })
      .catch(() => {
        if (active) setError("카테고리를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      await apiFetch("admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      setName("");
      setSlug("");
      setSortOrder("");
      await load();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "생성에 실패했습니다.",
      );
    } finally {
      setCreating(false);
    }
  }

  function startEdit(c: Category) {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditSort(String(c.sortOrder));
  }

  async function saveEdit(id: number) {
    if (!editName.trim() || !editSlug.trim()) return;
    try {
      await apiFetch(`admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          sortOrder: Number(editSort) || 0,
        }),
      });
      setEditId(null);
      await load();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "수정에 실패했습니다.",
      );
    }
  }

  async function handleDelete(c: Category) {
    if (!window.confirm(`'${c.name}' 카테고리를 삭제할까요?`)) return;
    try {
      await apiFetch(`admin/categories/${c.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "삭제에 실패했습니다.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Categories</span>
        <h1 className="mt-2 text-3xl font-bold">카테고리 관리</h1>
        <p className="mt-2 text-slate-600">
          슬러그는 영문 소문자·숫자·하이픈만 사용하며, URL 식별자로 쓰입니다.
        </p>
      </div>

      {/* 생성 폼 */}
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="min-w-40 flex-1">
          <label htmlFor="category-name" className="mb-1.5 block text-sm font-semibold text-slate-900">이름</label>
          <input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 자유게시판"
            className="field"
          />
        </div>
        <div className="min-w-40 flex-1">
          <label htmlFor="category-slug" className="mb-1.5 block text-sm font-semibold text-slate-900">슬러그</label>
          <input
            id="category-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="예: free"
            className="field"
          />
        </div>
        <div className="w-28">
          <label htmlFor="category-sort" className="mb-1.5 block text-sm font-semibold text-slate-900">정렬</label>
          <input
            id="category-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            type="number"
            placeholder="0"
            className="field"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !name.trim() || !slug.trim()}
          className="btn btn-accent px-6! py-2.5!"
        >
          {creating ? "추가 중…" : "추가"}
        </button>
      </form>

      {/* 목록 */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="w-20 px-5 py-3 text-center">정렬</th>
              <th className="px-5 py-3 text-left">이름</th>
              <th className="px-5 py-3 text-left">슬러그</th>
              <th className="w-20 px-5 py-3 text-center">글 수</th>
              <th className="w-40 px-5 py-3 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {error ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : items === null ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                  불러오는 중…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                  카테고리가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((c) =>
                editId === c.id ? (
                  <tr key={c.id} className="bg-indigo-50/40">
                    <td className="px-5 py-3">
                      <input
                        value={editSort}
                        onChange={(e) => setEditSort(e.target.value)}
                        type="number"
                        aria-label="정렬 순서"
                        className="field px-2! py-1.5! text-center"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        aria-label="카테고리 이름"
                        className="field px-3! py-1.5!"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        aria-label="카테고리 슬러그"
                        className="field px-3! py-1.5!"
                      />
                    </td>
                    <td className="px-5 py-3 text-center text-slate-400">{c.postCount}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-center gap-2 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => saveEdit(c.id)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-white"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600"
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-center text-slate-500">{c.sortOrder}</td>
                    <td className="px-5 py-4 font-medium text-slate-900">{c.name}</td>
                    <td className="px-5 py-4">
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {c.slug}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500">{c.postCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-3 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="text-slate-500 hover:text-slate-900"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          disabled={c.postCount > 0}
                          title={c.postCount > 0 ? "게시글이 있어 삭제할 수 없습니다" : undefined}
                          className="text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
