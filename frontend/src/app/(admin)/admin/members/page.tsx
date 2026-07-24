"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { MemberStatusBadge } from "../../_components/badges";

// A-04 회원 관리 (승인/정지·권한 변경)
type Member = {
  id: string;
  email: string;
  name: string;
  department: string | null;
  status: string;
  roles: string[];
  emailConfirmed: boolean;
  createdAt: string;
};

type Paged = { items: Member[]; total: number; page: number; pageSize: number };

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: "", label: "전체" },
  { value: "Pending", label: "미인증" },
  { value: "Active", label: "활성" },
  { value: "Suspended", label: "정지" },
];

function roleOf(m: Member): string {
  return m.roles.includes("admin") ? "admin" : "employee";
}

export default function AdminMembersPage() {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // 조회 조건을 key로 태깅 — 조건 변경 시 파생값이 자동 로딩 상태가 된다
  const [result, setResult] = useState<{
    key: string;
    data?: Paged;
    error?: string;
  } | null>(null);
  const key = `${status}|${query}|${page}`;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));
    apiFetch<Paged>(`admin/members?${params.toString()}`)
      .then((d) => {
        if (active) setResult({ key, data: d ?? undefined });
      })
      .catch(() => {
        if (active) setResult({ key, error: "회원 목록을 불러오지 못했습니다." });
      });
    return () => {
      active = false;
    };
  }, [status, query, page, key]);

  const current = result && result.key === key ? result : null;
  const data = current?.data ?? null;
  const error = current?.error ?? null;

  // 상태/권한 변경 — 성공 시 해당 행만 즉시 갱신
  async function patchMember(m: Member, patch: { status?: string; role?: string }) {
    try {
      await apiFetch(`admin/members/${m.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setResult((prev) =>
        prev && prev.data
          ? {
              ...prev,
              data: {
                ...prev.data,
                items: prev.data.items.map((it) =>
                  it.id === m.id
                    ? {
                        ...it,
                        status: patch.status ?? it.status,
                        roles: patch.role
                          ? patch.role === "admin"
                            ? ["admin"]
                            : ["employee"]
                          : it.roles,
                      }
                    : it,
                ),
              },
            }
          : prev,
      );
    } catch (err) {
      window.alert(
        err instanceof Error && err.message
          ? err.message
          : "변경에 실패했습니다.",
      );
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Members</span>
        <h1 className="mt-2 text-3xl font-bold">
          회원 관리
          {data && (
            <span className="ml-2 text-base font-medium text-slate-400">총 {data.total}명</span>
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
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(q.trim());
            setPage(1);
          }}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="회원 검색 (이름·이메일)"
            placeholder="이름·이메일 검색"
            className="field min-w-0 flex-1"
          />
          <button type="submit" className="btn btn-primary px-5! py-2.5!">
            검색
          </button>
        </form>
      </div>

      {/* 목록 */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-180 text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3 text-left">이름 / 이메일</th>
              <th className="px-5 py-3 text-left">부서</th>
              <th className="px-5 py-3 text-center">상태</th>
              <th className="px-5 py-3 text-center">권한</th>
              <th className="px-5 py-3 text-center">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {error ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : data === null ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                  불러오는 중…
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-slate-400">
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              data.items.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{m.name}</p>
                    <p className="text-slate-500">
                      {m.email}
                      {!m.emailConfirmed && (
                        <span className="ml-1.5 text-xs text-amber-600">(미인증)</span>
                      )}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{m.department ?? "–"}</td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MemberStatusBadge status={m.status} />
                      <select
                        value={m.status}
                        onChange={(e) => patchMember(m, { status: e.target.value })}
                        aria-label={`${m.name} 상태 변경`}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                      >
                        <option value="Pending">미인증</option>
                        <option value="Active">활성</option>
                        <option value="Suspended">정지</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <select
                      value={roleOf(m)}
                      onChange={(e) => patchMember(m, { role: e.target.value })}
                      aria-label={`${m.name} 권한 변경`}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="employee">직원</option>
                      <option value="admin">관리자</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-center text-slate-400">
                    {m.createdAt.slice(0, 10)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {data && totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-outline px-4! py-2! disabled:opacity-40"
          >
            이전
          </button>
          <span className="text-sm text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn btn-outline px-4! py-2! disabled:opacity-40"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  );
}
