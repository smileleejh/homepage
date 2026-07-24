"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// E-05 내 프로필 — 이름·부서 수정, 비밀번호 변경
interface Profile {
  email: string;
  name: string;
  department: string | null;
  status: string;
  roles: string[];
}

// 폼 하단 알림 (성공/실패 공용)
type Notice = { kind: "success" | "error"; text: string } | null;

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 기본 정보 폼
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoNotice, setInfoNotice] = useState<Notice>(null);

  // 비밀번호 폼
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);

  // 프로필 로드 — 폼 초기값 채우기
  useEffect(() => {
    let active = true;
    apiFetch<Profile>("auth/profile")
      .then((data) => {
        if (!active || !data) return;
        setProfile(data);
        setName(data.name);
        setDepartment(data.department ?? "");
      })
      .catch(() => {
        if (active) setLoadError("프로필을 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveInfo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoNotice(null);
    try {
      await apiFetch("auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name, department }),
      });
      setInfoNotice({ kind: "success", text: "저장되었습니다." });
      // 화면 상단 표시값도 갱신
      setProfile((prev) =>
        prev ? { ...prev, name, department: department.trim() || null } : prev,
      );
    } catch (err) {
      setInfoNotice({
        kind: "error",
        text: err instanceof Error && err.message ? err.message : "저장에 실패했습니다.",
      });
    } finally {
      setSavingInfo(false);
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordNotice(null);

    // 확인 일치는 서버에 보내기 전에 먼저 거른다
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ kind: "error", text: "새 비밀번호와 확인이 일치하지 않습니다." });
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch("auth/profile/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPasswordNotice({ kind: "success", text: "비밀번호가 변경되었습니다." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordNotice({
        kind: "error",
        text:
          err instanceof Error && err.message
            ? err.message
            : "비밀번호 변경에 실패했습니다.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <span className="eyebrow">My account</span>
        <h1 className="mt-2 text-3xl font-bold">내 프로필</h1>
        <p className="mt-2 text-slate-600">이름 · 부서 · 비밀번호를 관리합니다.</p>
      </div>

      {/* 기본 정보 */}
      <form onSubmit={saveInfo} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold">기본 정보</h2>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-900">이메일</label>
          {/* 이메일은 로그인 식별자라 이 화면에서 변경하지 않는다 */}
          <input
            value={profile?.email ?? ""}
            readOnly
            disabled
            className="field cursor-not-allowed bg-slate-50 text-slate-500"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-900">
              이름
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="이름"
              className="field"
              disabled={!profile}
            />
          </div>
          <div>
            <label htmlFor="department" className="mb-1.5 block text-sm font-semibold text-slate-900">
              부서
            </label>
            <input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="부서(선택)"
              className="field"
              disabled={!profile}
            />
          </div>
        </div>

        {infoNotice && (
          <p
            role={infoNotice.kind === "success" ? "status" : "alert"}
            className={`text-sm ${
              infoNotice.kind === "success" ? "text-green-700" : "text-red-600"
            }`}
          >
            {infoNotice.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!profile || savingInfo}
            className="btn btn-primary px-6! py-2.5! disabled:opacity-50"
          >
            {savingInfo ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>

      {/* 비밀번호 변경 */}
      <form onSubmit={changePassword} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold">비밀번호 변경</h2>
        <div>
          <label htmlFor="current-password" className="mb-1.5 block text-sm font-semibold text-slate-900">
            현재 비밀번호
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="현재 비밀번호"
            className="field"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-slate-900">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="새 비밀번호"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-900">
              새 비밀번호 확인
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="새 비밀번호 확인"
              className="field"
            />
          </div>
        </div>

        {passwordNotice && (
          <p
            role={passwordNotice.kind === "success" ? "status" : "alert"}
            className={`text-sm ${
              passwordNotice.kind === "success" ? "text-green-700" : "text-red-600"
            }`}
          >
            {passwordNotice.text}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPassword}
            className="btn btn-accent px-6! py-2.5! disabled:opacity-50"
          >
            {savingPassword ? "변경 중…" : "변경"}
          </button>
        </div>
      </form>
    </div>
  );
}
