"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type AttachmentItem = {
  id: number;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  canDelete: boolean;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentList({ postId }: { postId: string }) {
  const [items, setItems] = useState<AttachmentItem[] | null>(null);

  async function load() {
    try {
      const data = await apiFetch<AttachmentItem[]>(`posts/${postId}/attachments`);
      setItems(data ?? []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    let active = true;
    apiFetch<AttachmentItem[]>(`posts/${postId}/attachments`)
      .then((data) => {
        if (active) setItems(data ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, [postId]);

  async function handleDelete(id: number) {
    if (!window.confirm("첨부파일을 삭제할까요?")) return;
    try {
      await apiFetch(`attachments/${id}`, { method: "DELETE" });
      await load();
    } catch {
      window.alert("삭제에 실패했습니다. 권한을 확인하세요.");
    }
  }

  // 첨부가 없으면 영역 숨김
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-100 pt-6">
      <h2 className="text-sm font-semibold text-slate-900">첨부파일 {items.length}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-2.5"
          >
            {/* BFF(/api/*)를 통해 백엔드에서 파일 스트리밍 */}
            <a
              href={`/api/attachments/${a.id}`}
              download
              className="flex min-w-0 items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              <span className="truncate">{a.originalName}</span>
              <span className="shrink-0 text-slate-400">({formatSize(a.sizeBytes)})</span>
            </a>
            {a.canDelete && (
              <button
                type="button"
                onClick={() => handleDelete(a.id)}
                className="shrink-0 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
