"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// A-06 게시글·댓글 관리 (모더레이션, 공지 고정)
type PostItem = {
  id: number;
  categorySlug: string;
  categoryName: string;
  title: string;
  authorName: string;
  isPinned: boolean;
  isDeleted: boolean;
  viewCount: number;
  commentCount: number;
  createdAt: string;
};

type CommentItem = {
  id: number;
  postId: number;
  postTitle: string;
  body: string;
  authorName: string;
  isDeleted: boolean;
  createdAt: string;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;
type Tab = "posts" | "comments";

export default function AdminPostsPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // 탭·필터 조건을 key로 태깅 — 조건 변경 시 파생값이 자동 로딩 상태가 된다
  const [result, setResult] = useState<{
    key: string;
    posts?: Paged<PostItem>;
    comments?: Paged<CommentItem>;
    error?: string;
  } | null>(null);
  const key = `${tab}|${query}|${includeDeleted}|${page}`;

  function buildQs() {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (includeDeleted) params.set("includeDeleted", "true");
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    return params.toString();
  }

  // 뮤테이션(삭제/복구/고정) 후 현재 탭·필터 기준으로 재조회 (이벤트 핸들러에서 호출)
  async function reload() {
    try {
      if (tab === "posts") {
        const d = await apiFetch<Paged<PostItem>>(`admin/posts?${buildQs()}`);
        setResult({ key, posts: d ?? undefined });
      } else {
        const d = await apiFetch<Paged<CommentItem>>(`admin/comments?${buildQs()}`);
        setResult({ key, comments: d ?? undefined });
      }
    } catch {
      setResult({ key, error: "목록을 불러오지 못했습니다." });
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (tab === "posts") {
          const d = await apiFetch<Paged<PostItem>>(`admin/posts?${buildQs()}`);
          if (active) setResult({ key, posts: d ?? undefined });
        } else {
          const d = await apiFetch<Paged<CommentItem>>(`admin/comments?${buildQs()}`);
          if (active) setResult({ key, comments: d ?? undefined });
        }
      } catch {
        if (active) setResult({ key, error: "목록을 불러오지 못했습니다." });
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, query, includeDeleted, page]);

  const current = result && result.key === key ? result : null;
  const posts = current?.posts ?? null;
  const comments = current?.comments ?? null;
  const error = current?.error ?? null;

  async function togglePin(p: PostItem) {
    try {
      await apiFetch(`admin/posts/${p.id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !p.isPinned }),
      });
      await reload();
    } catch {
      window.alert("공지 고정 변경에 실패했습니다.");
    }
  }

  async function togglePostDeleted(p: PostItem) {
    try {
      if (p.isDeleted) {
        await apiFetch(`admin/posts/${p.id}/restore`, { method: "POST" });
      } else {
        if (!window.confirm("이 게시글을 삭제할까요?")) return;
        await apiFetch(`admin/posts/${p.id}`, { method: "DELETE" });
      }
      await reload();
    } catch {
      window.alert("처리에 실패했습니다.");
    }
  }

  async function toggleCommentDeleted(c: CommentItem) {
    try {
      if (c.isDeleted) {
        await apiFetch(`admin/comments/${c.id}/restore`, { method: "POST" });
      } else {
        if (!window.confirm("이 댓글을 삭제할까요?")) return;
        await apiFetch(`admin/comments/${c.id}`, { method: "DELETE" });
      }
      await reload();
    } catch {
      window.alert("처리에 실패했습니다.");
    }
  }

  const paged = tab === "posts" ? posts : comments;
  const totalPages = paged ? Math.max(1, Math.ceil(paged.total / paged.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Moderation</span>
        <h1 className="mt-2 text-3xl font-bold">게시글·댓글 관리</h1>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {(["posts", "comments"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "posts" ? "게시글" : "댓글"}
          </button>
        ))}
      </div>

      {/* 검색·필터 */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
            setPage(1);
          }}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={tab === "posts" ? "게시글 검색 (제목·작성자)" : "댓글 검색 (내용·작성자)"}
            placeholder={tab === "posts" ? "제목·작성자 검색" : "내용·작성자 검색"}
            className="field min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-primary px-5! py-2.5!">
            검색
          </button>
        </form>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => {
              setIncludeDeleted(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          삭제 포함
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 게시글 목록 */}
      {tab === "posts" &&
        (posts === null ? (
          <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>
        ) : posts.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">게시글이 없습니다.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {posts.items.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {p.isPinned && (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                          공지
                        </span>
                      )}
                      {p.isDeleted && (
                        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                          삭제됨
                        </span>
                      )}
                      <Link
                        href={`/board/${p.categorySlug}/${p.id}`}
                        className={`truncate font-medium hover:underline ${
                          p.isDeleted ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      >
                        {p.title}
                      </Link>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {p.categoryName} · {p.authorName} · {p.createdAt.slice(0, 10)} · 조회{" "}
                      {p.viewCount} · 댓글 {p.commentCount}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => togglePin(p)}
                      disabled={p.isDeleted}
                      className="text-slate-500 hover:text-indigo-600 disabled:text-slate-300"
                    >
                      {p.isPinned ? "공지 해제" : "공지 고정"}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePostDeleted(p)}
                      className={
                        p.isDeleted
                          ? "text-emerald-600 hover:text-emerald-700"
                          : "text-red-500 hover:text-red-600"
                      }
                    >
                      {p.isDeleted ? "복구" : "삭제"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {/* 댓글 목록 */}
      {tab === "comments" &&
        (comments === null ? (
          <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>
        ) : comments.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">댓글이 없습니다.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {comments.items.map((c) => (
                <li key={c.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-900">{c.authorName}</span>
                      <span className="text-slate-400">{c.createdAt.slice(0, 10)}</span>
                      {c.isDeleted && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                          삭제됨
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-1 whitespace-pre-wrap text-sm ${
                        c.isDeleted ? "text-slate-400 line-through" : "text-slate-700"
                      }`}
                    >
                      {c.body}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      게시글: {c.postTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCommentDeleted(c)}
                    className={`shrink-0 text-xs font-medium ${
                      c.isDeleted
                        ? "text-emerald-600 hover:text-emerald-700"
                        : "text-red-500 hover:text-red-600"
                    }`}
                  >
                    {c.isDeleted ? "복구" : "삭제"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

      {/* 페이지네이션 */}
      {paged && totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-outline px-4! py-2! disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn-outline px-4! py-2! disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
