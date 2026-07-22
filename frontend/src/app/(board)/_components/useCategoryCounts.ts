"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { CategoryWithCount } from "@/lib/board";

// 카테고리별 실제 게시물 수 (slug → count). 로딩 중이면 null.
export function useCategoryCounts(): Record<string, number> | null {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<CategoryWithCount[]>("categories")
      .then((data) => {
        if (active && data) {
          setCounts(Object.fromEntries(data.map((c) => [c.slug, c.count])));
        }
      })
      .catch(() => {
        if (active) setCounts({});
      });
    return () => {
      active = false;
    };
  }, []);

  return counts;
}
