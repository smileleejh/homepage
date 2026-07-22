"use client";

import { useEffect, useState } from "react";

// 로그인 여부를 BFF(/api/auth/me)로 확인하는 클라이언트 훅.
// 반환: [authed, setAuthed] — null=확인 중, true=로그인, false=비로그인.
export function useAuthed(): [boolean | null, (v: boolean) => void] {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (active) setAuthed(res.ok);
      })
      .catch(() => {
        if (active) setAuthed(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return [authed, setAuthed];
}

// 로그아웃 요청(세션 쿠키 만료). 네트워크 오류는 조용히 넘긴다.
export async function requestLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // 무시 — 호출측에서 홈으로 이동/상태 갱신 처리
  }
}
