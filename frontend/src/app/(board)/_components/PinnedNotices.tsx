"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// 게시판 홈 상단 공지 영역 — 공지사항 게시판에서 체크(고정)한 글 노출
type PostItem = {
  id: number;
  categorySlug: string;
  title: string;
  authorName: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
};

export default function PinnedNotices() {
  const [posts, setPosts] = useState<PostItem[] | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<PostItem[]>("posts/pinned")
      .then((data) => {
        if (active) setPosts(data ?? []);
      })
      .catch(() => {
        if (active) setPosts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // 노출할 공지가 없으면 영역 자체를 숨김
  if (!posts || posts.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {posts.map((p) => (
          <li key={p.id}>
            <Link
              href={`/board/${p.categorySlug}/${p.id}`}
              className="flex items-start gap-3 border-l-4 border-l-indigo-500 p-5 transition-colors hover:bg-slate-50"
            >
              <span className="mt-0.5 shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                공지
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-bold text-slate-900">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {p.authorName} · {p.createdAt.slice(0, 10)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
