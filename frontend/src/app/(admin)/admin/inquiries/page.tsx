"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { InquiryStatusBadge } from "../../_components/badges";

// A-02 문의 목록 (상태/키워드 필터)
type Inquiry = {
  id: number;
  name: string;
  email: string;
  title: string;
  status: string;
  assignedAdminName: string | null;
  createdAt: string;
};

const STATUS_FILTERS = [
  { value: "", label: "전체" },
  { value: "Received", label: "접수" },
  { value: "InProgress", label: "처리중" },
  { value: "Done", label: "완료" },
];

export default function AdminInquiriesPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState(""); // 실제 검색에 적용된 키워드
  // 조회 조건을 key로 태깅해 저장 — 조건이 바뀌면 파생값이 자동으로 로딩 상태가 된다
  // (effect 본문에서 동기 setState 호출을 피하기 위한 패턴)
  const [result, setResult] = useState<{
    key: string;
    items?: Inquiry[];
    error?: string;
  } | null>(null);
  const key = `${status}|${query}`;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    apiFetch<Inquiry[]>(`admin/inquiries${qs ? `?${qs}` : ""}`)
      .then((d) => {
        if (active) setResult({ key, items: d ?? [] });
      })
      .catch(() => {
        if (active) setResult({ key, error: "목록을 불러오지 못했습니다." });
      });
    return () => {
      active = false;
    };
  }, [status, query, key]);

  const current = result && result.key === key ? result : null;
  const items = current?.items ?? null;
  const error = current?.error ?? null;

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setQuery(q.trim());
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Inquiries</span>
        <h1 className="mt-2 text-3xl font-bold">
          문의 관리
          {items && (
            <span className="ml-2 text-base font-medium text-slate-400">총 {items.length}건</span>
          )}
        </h1>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === f.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·이메일·제목·내용 검색"
            className="field min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-primary px-5! py-2.5!">
            검색
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setQuery("");
              }}
              className="btn btn-outline px-4! py-2.5!"
            >
              초기화
            </button>
          )}
        </form>
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden items-center gap-4 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:flex">
          <span className="w-16 shrink-0">상태</span>
          <span className="flex-1">제목 / 문의자</span>
          <span className="w-24 shrink-0 text-center">담당자</span>
          <span className="w-24 shrink-0 text-center">접수일</span>
        </div>

        {error ? (
          <p className="px-6 py-16 text-center text-sm text-red-600">{error}</p>
        ) : items === null ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-slate-400">해당 문의가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/admin/inquiries/${i.id}`}
                  className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <span className="w-16 shrink-0">
                    <InquiryStatusBadge status={i.status} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{i.title}</p>
                    <p className="truncate text-sm text-slate-500">
                      {i.name} · {i.email}
                    </p>
                  </div>
                  <span className="w-24 shrink-0 text-center text-sm text-slate-500">
                    {i.assignedAdminName ?? "–"}
                  </span>
                  <span className="w-24 shrink-0 text-center text-sm text-slate-400">
                    {i.createdAt.slice(0, 10)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
