"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BOARD_CATEGORIES } from "@/lib/board";
import { useIsAdmin } from "@/lib/auth";

const PAGE_SIZE = 10;

type PostItem = {
  id: number;
  categorySlug: string;
  title: string;
  authorName: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
};

type Paged = {
  items: PostItem[];
  total: number;
  page: number;
  pageSize: number;
};

// 페이지 번호 목록 생성 (많으면 앞뒤 일부 + … 로 축약)
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function PostListView({
  category,
  page,
}: {
  category: string;
  page: number;
}) {
  const categoryName =
    BOARD_CATEGORIES.find((c) => c.slug === category)?.name ?? category;
  const key = `${category}|${page}`;

  // 공지사항 게시판 + 관리자일 때만 공지 노출 체크박스 표시
  const isAdmin = useIsAdmin();
  const showPin = category === "notice" && isAdmin;

  const [result, setResult] = useState<{
    key: string;
    data?: Paged;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<Paged>(
      `posts?category=${encodeURIComponent(category)}&page=${page}&pageSize=${PAGE_SIZE}`,
    )
      .then((data) => {
        if (active) setResult({ key, data: data ?? undefined });
      })
      .catch((err) => {
        if (active)
          setResult({
            key,
            error: err instanceof Error ? err.message : "목록을 불러오지 못했습니다.",
          });
      });
    return () => {
      active = false;
    };
  }, [category, page, key]);

  // 현재 카테고리·페이지와 일치하는 결과만 사용 → 전환 시 로딩 표시
  const current = result && result.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // 공지 노출 토글 (관리자) — 성공 시 목록 항목 상태를 즉시 반영
  async function togglePin(p: PostItem) {
    const next = !p.isPinned;
    try {
      await apiFetch(`posts/${p.id}/pin`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: next }),
      });
      setResult((prev) =>
        prev && prev.data
          ? {
              ...prev,
              data: {
                ...prev.data,
                items: prev.data.items.map((it) =>
                  it.id === p.id ? { ...it, isPinned: next } : it,
                ),
              },
            }
          : prev,
      );
    } catch {
      window.alert("공지 노출 설정에 실패했습니다. 권한을 확인하세요.");
    }
  }

  return (
    <div className="space-y-6">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/board" className="transition-colors hover:text-slate-900">
          게시판
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{categoryName}</span>
      </nav>

      {/* 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {categoryName}
          {data && (
            <span className="ml-2 text-base font-medium text-slate-400">
              총 {data.total}개
            </span>
          )}
        </h1>
        {/* 이 게시판을 미리 선택한 채로 글쓰기 */}
        <Link
          href={`/board/new?category=${category}`}
          className="btn btn-accent px-5! py-2.5!"
        >
          글쓰기
        </Link>
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden items-center gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:flex">
          {showPin && <span className="w-10 shrink-0 text-center">공지</span>}
          <span className="flex-1">제목</span>
          <span className="w-20 shrink-0 text-center">작성자</span>
          <span className="w-24 shrink-0 text-center">작성일</span>
          <span className="w-14 shrink-0 text-right">조회</span>
        </div>

        {error ? (
          <p className="px-6 py-16 text-center text-sm text-red-600">{error}</p>
        ) : data === null ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">불러오는 중…</p>
        ) : data.items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-slate-400">아직 게시글이 없습니다.</p>
            <Link
              href={`/board/new?category=${category}`}
              className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              첫 글을 작성해 보세요 →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
              >
                {showPin && (
                  <label
                    className="hidden w-10 shrink-0 cursor-pointer justify-center sm:flex"
                    title="게시판 홈 상단 공지로 노출"
                  >
                    <input
                      type="checkbox"
                      checked={p.isPinned}
                      onChange={() => togglePin(p)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                )}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {p.isPinned && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                      공지
                    </span>
                  )}
                  <Link
                    href={`/board/${p.categorySlug}/${p.id}`}
                    className="min-w-0 flex-1 truncate font-medium text-slate-900 hover:underline"
                  >
                    {p.title}
                  </Link>
                </div>
                <span className="hidden w-20 shrink-0 text-center text-sm text-slate-500 sm:block">
                  {p.authorName}
                </span>
                <span className="hidden w-24 shrink-0 text-center text-sm text-slate-400 sm:block">
                  {p.createdAt.slice(0, 10)}
                </span>
                <span className="hidden w-14 shrink-0 text-right text-sm text-slate-400 sm:block">
                  {p.viewCount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 페이지네이션 */}
      {data && totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5">
          {page > 1 ? (
            <Link
              href={`/board/${category}?page=${page - 1}`}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              이전
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-3 py-2 text-sm font-medium text-slate-300">
              이전
            </span>
          )}

          {pageList(page, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e${i}`} className="px-2 text-slate-400">
                …
              </span>
            ) : p === page ? (
              <span
                key={p}
                aria-current="page"
                className="grid h-9 min-w-9 place-items-center rounded-lg bg-slate-900 px-2 text-sm font-semibold text-white"
              >
                {p}
              </span>
            ) : (
              <Link
                key={p}
                href={`/board/${category}?page=${p}`}
                className="grid h-9 min-w-9 place-items-center rounded-lg border border-slate-200 px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {p}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link
              href={`/board/${category}?page=${page + 1}`}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              다음
            </Link>
          ) : (
            <span className="rounded-lg border border-slate-100 px-3 py-2 text-sm font-medium text-slate-300">
              다음
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
