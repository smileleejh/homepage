"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// A-07 콘텐츠 편집 (하이브리드 CMS — page_contents)
type ContentItem = {
  key: string;
  title: string | null;
  isVisible: boolean;
  updatedAt: string;
  updatedByName: string | null;
};

type ContentDetail = {
  key: string;
  title: string | null;
  body: string;
  isVisible: boolean;
  updatedAt: string;
  updatedByName: string | null;
};

export default function AdminContentPage() {
  const [list, setList] = useState<ContentItem[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 편집 상태
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [visible, setVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 목록 로드 (+ 첫 항목 자동 선택)
  useEffect(() => {
    let active = true;
    apiFetch<ContentItem[]>("admin/content")
      .then((d) => {
        if (!active) return;
        setList(d ?? []);
        if (d && d.length > 0) setSelected(d[0].key);
      })
      .catch(() => {
        if (active) setError("콘텐츠 목록을 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, []);

  // 선택된 키 상세 로드
  useEffect(() => {
    if (!selected) return;
    let active = true;
    apiFetch<ContentDetail>(`admin/content/${selected}`)
      .then((d) => {
        if (!active || !d) return;
        setDetail(d);
        setTitle(d.title ?? "");
        setBody(d.body);
        setVisible(d.isVisible);
      })
      .catch(() => {
        if (active) setError("콘텐츠를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [selected]);

  async function handleSave() {
    if (!selected || !body.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch(`admin/content/${selected}`, {
        method: "PUT",
        body: JSON.stringify({ title, body, isVisible: visible }),
      });
      setSaved(true);
      // 목록의 제목·노출상태를 즉시 반영(수정시각은 다음 로드에 반영)
      setList((prev) =>
        prev
          ? prev.map((it) =>
              it.key === selected ? { ...it, title, isVisible: visible } : it,
            )
          : prev,
      );
    } catch {
      window.alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Content</span>
        <h1 className="mt-2 text-3xl font-bold">콘텐츠 편집</h1>
        <p className="mt-2 text-slate-600">
          공개 페이지의 지정 편집 영역(인사말·배너·공지)을 수정합니다.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* 편집 영역 목록 */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {list === null ? (
            <p className="p-4 text-sm text-slate-400">불러오는 중…</p>
          ) : list.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">편집 영역이 없습니다.</p>
          ) : (
            <nav className="flex flex-col gap-1">
              {list.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setSelected(c.key);
                    setSaved(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selected === c.key
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {c.title || c.key}
                    {!c.isVisible && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          selected === c.key
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        숨김
                      </span>
                    )}
                  </span>
                  <span
                    className={`block text-xs ${
                      selected === c.key ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {c.key}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* 에디터 */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {!selected ? (
            <p className="py-16 text-center text-sm text-slate-400">
              왼쪽에서 편집 영역을 선택하세요.
            </p>
          ) : detail === null || detail.key !== selected ? (
            <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {selected}
                </code>
                {detail.updatedByName && (
                  <span className="text-xs text-slate-400">
                    최종 수정: {detail.updatedByName} · {detail.updatedAt.slice(0, 10)}
                  </span>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">제목</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목(선택)"
                  className="field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-900">본문</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  placeholder="본문 내용"
                  className="field"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  공개 페이지에 노출
                  <span className="text-xs text-slate-400">
                    (끄면 홈 공지는 숨겨지고, 그 외 영역은 기본 문구로 대체)
                  </span>
                </label>
                <div className="flex items-center gap-3">
                  {saved && <span className="text-sm text-emerald-600">저장되었습니다.</span>}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !body.trim()}
                    className="btn btn-accent px-6! py-2.5!"
                  >
                    {saving ? "저장 중…" : "저장"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
