"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { InquiryStatusBadge } from "../_components/badges";

// A-01 관리자 대시보드 — 신규/미처리 문의, 가입 대기, 최근 게시글 요약
type Inquiry = {
  id: number;
  name: string;
  title: string;
  status: string;
  assignedAdminName: string | null;
  createdAt: string;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

type PostItem = {
  id: number;
  categorySlug: string;
  title: string;
  authorName: string;
  createdAt: string;
};

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number | null;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-extrabold ${
          accent ? "text-indigo-600" : "text-slate-900"
        }`}
      >
        {value ?? "–"}
      </p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [pendingMembers, setPendingMembers] = useState<number | null>(null);
  const [recentPosts, setRecentPosts] = useState<PostItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Inquiry[]>("admin/inquiries"),
      apiFetch<Paged<unknown>>("admin/members?status=Pending&pageSize=1"),
      apiFetch<Paged<PostItem>>("admin/posts?pageSize=5"),
    ])
      .then(([inq, mem, posts]) => {
        if (!active) return;
        setInquiries(inq ?? []);
        setPendingMembers(mem?.total ?? 0);
        setRecentPosts(posts?.items ?? []);
      })
      .catch(() => {
        if (active) setError("대시보드 데이터를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, []);

  const received = inquiries?.filter((i) => i.status === "Received").length ?? null;
  const inProgress = inquiries?.filter((i) => i.status === "InProgress").length ?? null;
  const openTotal =
    received !== null && inProgress !== null ? received + inProgress : null;
  const recentInquiries = inquiries?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <span className="eyebrow">Dashboard</span>
        <h1 className="mt-2 text-3xl font-bold">대시보드</h1>
        <p className="mt-2 text-slate-600">문의·회원·게시판 현황 요약입니다.</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="신규 문의 (접수)" value={received} href="/admin/inquiries" accent />
        <StatCard label="처리중 문의" value={inProgress} href="/admin/inquiries" />
        <StatCard label="미처리 합계" value={openTotal} href="/admin/inquiries" />
        <StatCard label="가입 대기" value={pendingMembers} href="/admin/members" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 최근 문의 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">최근 문의</h2>
            <Link
              href="/admin/inquiries"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              전체 보기 →
            </Link>
          </div>
          {inquiries === null ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : recentInquiries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">접수된 문의가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentInquiries.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  <InquiryStatusBadge status={i.status} />
                  <Link
                    href={`/admin/inquiries/${i.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:underline"
                  >
                    {i.title}
                  </Link>
                  <span className="shrink-0 text-xs text-slate-400">
                    {i.createdAt.slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 최근 게시글 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">최근 게시글</h2>
            <Link
              href="/admin/posts"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              전체 보기 →
            </Link>
          </div>
          {recentPosts === null ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : recentPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">게시글이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPosts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <Link
                    href={`/board/${p.categorySlug}/${p.id}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <span className="shrink-0 text-xs text-slate-500">{p.authorName}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {p.createdAt.slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
