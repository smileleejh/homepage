"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import PostForm from "../../../../_components/PostForm";

type PostDetailT = {
  id: number;
  categorySlug: string;
  title: string;
  body: string;
  isPinned: boolean;
  canDelete: boolean;
};

// E-04 글 수정 — 기존 값을 불러와 PostForm(edit)에 전달 (조회수 증가 안 함)
export default function EditPostPage() {
  const params = useParams<{ category: string; postId: string }>();
  const { category, postId } = params;

  const [post, setPost] = useState<PostDetailT | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiFetch<PostDetailT>(`posts/${postId}?countView=false`)
      .then((data) => {
        if (active) setPost(data);
      })
      .catch(() => {
        if (active) setError("게시글을 불러올 수 없습니다.");
      });
    return () => {
      active = false;
    };
  }, [postId]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={`/board/${category}`} className="btn btn-outline mt-6 px-5! py-2.5!">
          ← 목록으로
        </Link>
      </div>
    );
  }

  if (post === null) {
    return <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>;
  }

  if (!post.canDelete) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-slate-500">수정 권한이 없습니다.</p>
        <Link
          href={`/board/${post.categorySlug}/${post.id}`}
          className="btn btn-outline mt-6 px-5! py-2.5!"
        >
          ← 게시글로
        </Link>
      </div>
    );
  }

  return (
    <PostForm
      mode="edit"
      postId={post.id}
      initialCategory={post.categorySlug}
      initialTitle={post.title}
      initialBody={post.body}
      initialPinned={post.isPinned}
    />
  );
}
