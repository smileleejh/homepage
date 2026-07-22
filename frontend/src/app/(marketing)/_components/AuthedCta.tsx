"use client";

import Link from "next/link";
import { useAuthed } from "@/lib/auth";

// 홈 CTA 버튼 — 로그인 상태면 게시판 바로가기, 아니면 직원 로그인
export default function AuthedCta() {
  const [authed] = useAuthed();

  return authed ? (
    <Link href="/board" className="btn btn-glass">
      게시판 바로가기
    </Link>
  ) : (
    <Link href="/login" className="btn btn-glass">
      직원 로그인
    </Link>
  );
}
