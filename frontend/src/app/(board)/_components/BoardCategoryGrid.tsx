"use client";

import Link from "next/link";
import { BOARD_CATEGORIES } from "@/lib/board";
import { useCategoryCounts } from "./useCategoryCounts";

// 게시판 홈 카테고리 카드 — 실제 게시물 수 표시
export default function BoardCategoryGrid() {
  const counts = useCategoryCounts();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BOARD_CATEGORIES.map((c) => (
        <Link key={c.slug} href={`/board/${c.slug}`} className="card group block">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{c.name}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {counts?.[c.slug] ?? 0}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
            바로가기 →
          </span>
        </Link>
      ))}
    </div>
  );
}
