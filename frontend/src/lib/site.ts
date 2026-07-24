// 사이트 전역 SEO 설정 — 메타데이터·사이트맵·robots가 공유하는 단일 출처.
//
// 배포 도메인은 아직 미확정(PRD §9)이라 환경변수로 주입한다.
// NEXT_PUBLIC_SITE_URL은 클라이언트 번들에도 들어가므로 비밀이 아니어야 한다(공개 URL이라 무방).
// 미설정 시 localhost로 폴백하되, 그 값이 사이트맵·OG 절대주소에 박히면 안 되므로
// 배포 환경에서는 반드시 실제 도메인을 설정해야 한다.

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 뒤 슬래시를 제거해 경로를 이어붙일 때 중복 슬래시가 생기지 않게 한다
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

export const SITE_NAME = "회사 홈페이지";

export const SITE_DESCRIPTION =
  "회사 소개부터 고객 문의 접수, 직원 전용 사내 게시판까지 — 신뢰할 수 있는 하나의 플랫폼.";

// 소셜 공유(OG)에서 사이트를 식별하는 브랜드명. 헤더·푸터 로고와 맞춘다.
export const SITE_BRAND = "COMPANY";
