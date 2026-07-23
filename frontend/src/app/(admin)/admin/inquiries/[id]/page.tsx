"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { INQUIRY_STATUS_LABEL } from "../../../_components/badges";

// A-03 문의 상세·상태관리 (상태 전환 / 담당자 지정 / 내부 메모)
type Detail = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  category: string | null;
  title: string;
  message: string;
  status: string;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  adminMemo: string | null;
  privacyConsent: boolean;
  createdIp: string | null;
  createdAt: string;
  updatedAt: string;
};

type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };
type Admin = { id: string; name: string; email: string };

const STATUS_OPTIONS = ["Received", "InProgress", "Done"];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:gap-4">
      <span className="w-28 shrink-0 text-sm font-semibold text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 text-sm text-slate-800">{value || "–"}</span>
    </div>
  );
}

export default function AdminInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태
  const [status, setStatus] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Detail>(`admin/inquiries/${id}`),
      apiFetch<Paged<Admin>>("admin/members?role=admin&pageSize=50"),
    ])
      .then(([d, mem]) => {
        if (!active || !d) return;
        setDetail(d);
        setStatus(d.status);
        setAssignedAdminId(d.assignedAdminId ?? "");
        setMemo(d.adminMemo ?? "");
        setAdmins(mem?.items ?? []);
      })
      .catch(() => {
        if (active) setError("문의를 찾을 수 없습니다.");
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch(`admin/inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          assignedAdminId, // "" 이면 담당자 해제
          adminMemo: memo, // "" 이면 메모 삭제
        }),
      });
      setSaved(true);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status,
              assignedAdminId: assignedAdminId || null,
              assignedAdminName:
                admins.find((a) => a.id === assignedAdminId)?.name ?? null,
              adminMemo: memo || null,
            }
          : prev,
      );
    } catch {
      window.alert("저장에 실패했습니다. 입력값과 권한을 확인하세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/inquiries" className="transition-colors hover:text-slate-900">
          문의 관리
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">#{id}</span>
      </nav>

      {error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/admin/inquiries" className="btn btn-outline mt-6 px-5! py-2.5!">
            ← 목록으로
          </Link>
        </div>
      ) : detail === null ? (
        <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>
      ) : (
        <>
          {/* 문의 내용 */}
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold">{detail.title}</h1>
            <div className="mt-6">
              <Row label="문의자" value={detail.name} />
              <Row label="이메일" value={detail.email} />
              <Row label="회사" value={detail.company} />
              <Row label="연락처" value={detail.phone} />
              <Row label="유형" value={detail.category} />
              <Row
                label="접수일"
                value={detail.createdAt.replace("T", " ").slice(0, 16)}
              />
              <Row label="접수 IP" value={detail.createdIp} />
            </div>
            <div className="mt-6 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
              {detail.message}
            </div>
          </section>

          {/* 처리 (상태/담당자/메모) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold">처리</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="field"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {INQUIRY_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">담당자</label>
                <select
                  value={assignedAdminId}
                  onChange={(e) => setAssignedAdminId(e.target.value)}
                  className="field"
                >
                  <option value="">담당자 없음</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                내부 메모
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                placeholder="처리 메모(관리자 전용)"
                className="field"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              {saved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-accent px-6! py-2.5!"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </section>

          <Link href="/admin/inquiries" className="btn btn-outline px-5! py-2.5!">
            ← 목록으로
          </Link>
        </>
      )}
    </div>
  );
}
