"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import CommentSection from "../../../_components/CommentSection";
import AttachmentList from "../../../_components/AttachmentList";

// E-03 게시글 상세 (본문, 조회수 증가, 삭제) — 실제 API 연동
type PostDetailT = {
  id: number;
  categorySlug: string;
  categoryName: string;
  title: string;
  body: string;
  authorName: string;
  isPinned: boolean;
  viewCount: number;
  createdAt: string;
  canDelete: boolean;
};

export default function PostDetailPage() {
  const params = useParams<{ category: string; postId: string }>();
  const { category, postId } = params;
  const router = useRouter();

  const [post, setPost] = useState<PostDetailT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<PostDetailT>(`posts/${postId}`)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch(() => {
        if (active) setError("게시글을 찾을 수 없습니다.");
      });
    return () => {
      active = false;
    };
  }, [postId]);

  async function handleDelete() {
    if (!post) return;
    if (!window.confirm("이 게시글을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    try {
      await apiFetch(`posts/${post.id}`, { method: "DELETE" });
      router.push(`/board/${post.categorySlug}`);
      router.refresh();
    } catch {
      setDeleting(false);
      window.alert("삭제에 실패했습니다. 권한을 확인하세요.");
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
        <Link href={`/board/${category}`} className="transition-colors hover:text-slate-900">
          {post?.categoryName ?? category}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">#{postId}</span>
      </nav>

      {error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p role="alert" className="text-sm text-red-600">{error}</p>
          <Link href={`/board/${category}`} className="btn btn-outline mt-6 px-5! py-2.5!">
            ← 목록으로
          </Link>
        </div>
      ) : post === null ? (
        <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>
      ) : (
        <>
          {/* 본문 카드 */}
          <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-2">
              {post.isPinned && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                  공지
                </span>
              )}
              <span className="text-xs font-semibold text-slate-400">{post.categoryName}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 pb-5 text-sm text-slate-400">
              <span className="font-medium text-slate-600">{post.authorName}</span>
              <span>{post.createdAt.slice(0, 10)}</span>
              <span>조회 {post.viewCount}</span>
            </div>
            <div className="mt-6 whitespace-pre-wrap leading-relaxed text-slate-700">
              {post.body}
            </div>
            <AttachmentList postId={postId} />
          </article>

          {/* 댓글 */}
          <CommentSection postId={postId} />

          {/* 하단 액션 */}
          <div className="flex items-center justify-between">
            <Link href={`/board/${post.categorySlug}`} className="btn btn-outline px-5! py-2.5!">
              ← 목록으로
            </Link>
            {post.canDelete && (
              <div className="flex gap-2">
                <Link
                  href={`/board/${post.categorySlug}/${post.id}/edit`}
                  className="btn btn-outline px-5! py-2.5!"
                >
                  수정
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn border border-red-200 bg-white px-5! py-2.5! text-red-600 hover:bg-red-50"
                >
                  {deleting ? "삭제 중…" : "삭제"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
