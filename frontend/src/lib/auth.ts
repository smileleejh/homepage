"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// /api/auth/me 응답 — 프로브 엔드포인트라 익명도 200으로 받고 authenticated로 구분한다.
interface AuthState {
  authenticated: boolean;
  email?: string;
  roles?: string[];
}

// 로그인 여부를 BFF(/api/auth/me)로 확인하는 클라이언트 훅.
// 반환: [authed, setAuthed] — null=확인 중, true=로그인, false=비로그인.
export function useAuthed(): [boolean | null, (v: boolean) => void] {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    // 프로브는 401이 아니라 200 + authenticated 플래그를 돌려준다(비로그인도 정상 응답)
    apiFetch<AuthState>("auth/me", undefined, { redirectOnUnauthorized: false })
      .then((me) => {
        if (active) setAuthed(Boolean(me?.authenticated));
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

// 현재 로그인 사용자가 관리자(admin 역할)인지 확인하는 클라이언트 훅
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    // 공개 페이지(SiteHeader)에서도 호출되는 프로브 — 익명도 200이라 오류를 내지 않는다
    apiFetch<AuthState>("auth/me", undefined, { redirectOnUnauthorized: false })
      .then((me) => {
        if (active && me?.authenticated) {
          setIsAdmin(me.roles?.includes("admin") ?? false);
        }
      })
      .catch(() => {
        // 오류 시 관리자 아님
      });
    return () => {
      active = false;
    };
  }, []);

  return isAdmin;
}

// 로그아웃 요청(세션 쿠키 만료). 네트워크 오류는 조용히 넘긴다.
export async function requestLogout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  } catch {
    // 무시 — 호출측에서 홈으로 이동/상태 갱신 처리
  }
}
