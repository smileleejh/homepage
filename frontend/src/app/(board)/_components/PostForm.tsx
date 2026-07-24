"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, extractProblemMessage } from "@/lib/api";
import { BOARD_CATEGORIES } from "@/lib/board";
import { useIsAdmin } from "@/lib/auth";

// 서버가 내려주는 첨부 제한 (GET /api/attachments/policy)
interface UploadPolicy {
  maxFileSizeBytes: number;
  maxFilesPerPost: number;
  allowedExtensions: string[];
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;
  if (bytes >= 1024) return `${Math.round((bytes / 1024) * 10) / 10}KB`;
  return `${bytes}B`;
}

// 업로드 전 1차 검증 — 최종 판단은 서버가 한다. 규칙을 못 받았으면 통과시키고 서버에 맡긴다.
function validateFiles(files: FileList, policy: UploadPolicy | null): string | null {
  if (!policy) return null;
  if (files.length > policy.maxFilesPerPost) {
    return `첨부는 게시글당 최대 ${policy.maxFilesPerPost}개입니다.`;
  }
  for (const file of Array.from(files)) {
    const dot = file.name.lastIndexOf(".");
    const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
    if (!extension || !policy.allowedExtensions.includes(extension)) {
      return `'${file.name}': 허용되지 않는 형식입니다. (허용: ${policy.allowedExtensions.join(" ")})`;
    }
    if (file.size > policy.maxFileSizeBytes) {
      return `'${file.name}': 파일당 최대 ${formatSize(policy.maxFileSizeBytes)}까지 첨부할 수 있습니다.`;
    }
  }
  return null;
}

// 게시글 작성/수정 공용 폼 (공지 등록: 관리자 + 공지사항 카테고리, 파일 첨부 포함)
export default function PostForm({
  mode,
  postId,
  initialCategory = "",
  initialTitle = "",
  initialBody = "",
  initialPinned = false,
}: {
  mode: "create" | "edit";
  postId?: number;
  initialCategory?: string;
  initialTitle?: string;
  initialBody?: string;
  initialPinned?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(initialCategory);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [policy, setPolicy] = useState<UploadPolicy | null>(null);
  const isAdmin = useIsAdmin();
  const isEdit = mode === "edit";
  const canPin = isAdmin && category === "notice"; // 공지 등록은 공지사항에서만
  const cancelHref =
    isEdit && postId != null ? `/board/${initialCategory}/${postId}` : "/board";

  // 첨부 제한은 서버가 source of truth — 화면에 하드코딩하지 않는다.
  // 조회 실패 시 policy는 null로 남고, 클라이언트 사전 검증 없이 서버 검증만 적용된다.
  useEffect(() => {
    let active = true;
    apiFetch<UploadPolicy>("attachments/policy")
      .then((data) => {
        if (active && data) setPolicy(data);
      })
      .catch(() => {
        // 무시 — 첨부 없이 글 저장은 가능하고, 최종 검증은 서버가 한다
      });
    return () => {
      active = false;
    };
  }, []);

  // 첨부파일 업로드 (multipart) — 실패 사유는 서버 메시지를 그대로 쓴다
  async function uploadFiles(id: number, files: FileList) {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch(`/api/posts/${id}/attachments`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      throw new Error(
        extractProblemMessage(raw) ??
          (res.status === 413
            ? "첨부파일 용량이 너무 큽니다."
            : "첨부파일 업로드에 실패했습니다."),
      );
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);

    // 첨부 검증은 글 저장 전에 한다 — 저장한 뒤 거절당하면 글만 남고 첨부가 빠진다
    const selectedFiles = fileInputRef.current?.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileError = validateFiles(selectedFiles, policy);
      if (fileError) {
        setError(fileError);
        setSubmitting(false);
        return;
      }
    }

    const pinned = canPin && form.get("pinned") === "on";
    const payload = JSON.stringify({
      categorySlug: category,
      title: form.get("title"),
      body: form.get("body"),
      pinned,
    });
    try {
      let targetId: number | undefined;
      if (isEdit && postId != null) {
        await apiFetch(`posts/${postId}`, { method: "PUT", body: payload });
        targetId = postId;
      } else {
        const created = await apiFetch<{ id: number; category: string }>("posts", {
          method: "POST",
          body: payload,
        });
        targetId = created?.id;
      }

      // 선택한 파일 업로드 (실패해도 글은 저장됨 — 사유를 알려주고 글 상세로 넘어간다)
      if (targetId != null && selectedFiles && selectedFiles.length > 0) {
        try {
          await uploadFiles(targetId, selectedFiles);
        } catch (err) {
          window.alert(
            err instanceof Error && err.message
              ? `첨부파일이 업로드되지 않았습니다.\n${err.message}`
              : "첨부파일 업로드에 실패했습니다.",
          );
        }
      }

      router.push(targetId != null ? `/board/${category}/${targetId}` : `/board/${category}`);
      router.refresh();
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
          <select
            name="categorySlug"
            required
            aria-label="카테고리"
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
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
            aria-label="제목"
            placeholder="제목을 입력하세요"
            defaultValue={initialTitle}
            className="field"
          />
        </div>

        <textarea
          name="body"
          required
          aria-label="본문"
          placeholder="본문을 입력하세요"
          rows={12}
          defaultValue={initialBody}
          className="field resize-none"
        />

        {/* 공지 등록 — 관리자 + 공지사항 카테고리에서만 */}
        {canPin && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={initialPinned}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            공지로 등록 <span className="text-slate-400">(게시판 홈 상단 노출)</span>
          </label>
        )}

        {/* 파일 첨부 */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">파일 첨부</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={policy?.allowedExtensions.join(",")}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
          />
          {policy && (
            <p className="mt-1.5 text-xs text-slate-500">
              최대 {policy.maxFilesPerPost}개 · 파일당 {formatSize(policy.maxFileSizeBytes)}까지 ·
              허용 형식 {policy.allowedExtensions.join(" ")}
            </p>
          )}
          {isEdit && (
            <p className="mt-1.5 text-xs text-slate-400">
              선택한 파일은 기존 첨부에 추가됩니다.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
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
