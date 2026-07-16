# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 및 커뮤니케이션 규칙

- **기본 응답 언어**: 한국어
- **코드 주석**: 한국어
- **커밋 메시지**: 한국어
- **문서화**: 한국어
- **변수명 / 함수명**: 영어 (코드 표준 준수)

## 프로젝트 규칙 (`.claude/rules/` — 반드시 준수)

- **코드 스타일** (`.claude/rules/code-style.md`): 들여쓰기 **스페이스 2칸**, 변수 camelCase, 상수 SNAKE_CASE, 함수 동사형, 클래스 PascalCase, 한글 주석.
  - 언어별 적용은 루트 **`.editorconfig`** 로 강제한다. **들여쓰기 2칸은 전 코드베이스 공통**이고, 네이밍은 각 언어 관례를 따른다 — C# 타입/메서드/상수는 PascalCase 유지, TS는 룰 그대로(camelCase 변수 / SNAKE_CASE 상수).
- **Git** (`.claude/rules/git-rules.md`): 커밋 메시지 **한글**, 브랜치 `feature/기능명`·`fix/버그명`·`hotfix/긴급수정`·`release/릴리즈명`, **커밋 전 반드시 린트 실행**(프론트 `npm run lint`).

## 프로젝트 현황

- **스캐폴딩 완료** — 백엔드/프론트 모두 빌드 통과. 초기 EF 마이그레이션(InitialCreate) 생성됨.
- **실행 검증(실DB 연동)은 미완** — DB는 **Supabase(관리형 PostgreSQL)** 로 확정. 연결 문자열을 user-secrets로 주입해야 마이그레이션 적용·구동 가능.
- 문서: `docs/PRD.md`(요구사항 **source of truth**), `docs/DESIGN.md`(설계서), 이 파일.

## 무엇을 만드는가

**Next.js 프론트엔드**가 **ASP.NET Core Web API**를 호출하는 3영역 회사 웹사이트다.

1. **공개 사이트** — 회사 소개 페이지 + 고객 문의 폼. SEO 중요 → SSR/SSG.
2. **직원 전용 사내 게시판** — 게시글/댓글/첨부/카테고리/공지고정/조회수. 로그인 필요.
3. **관리자 영역** — 문의 관리, 회원 관리, 게시판 모더레이션, 지정 CMS 콘텐츠 편집.

작업 전 `docs/PRD.md`(화면 목록 `P-`공개/`E-`직원/`A-`관리자, 기능 `P0/P1/P2`, 데이터 모델 §5, 스택·아키 §8)와 `docs/DESIGN.md`(라우트 맵, API 엔드포인트 맵, 유저플로우, 폴더 구조, 로드맵 M0~M5)를 읽을 것.

## 기술 스택 및 아키텍처

- **프론트**: Next.js 16 (App Router, React, TypeScript). 공개 SSR/SSG, 게시판·관리자 UI, **BFF 프록시** 담당.
- **백엔드**: ASP.NET Core 10 Web API (C#), **Entity Framework Core** (+ Npgsql).
- **DB**: **Supabase(PostgreSQL)** — EF Core가 Npgsql로 연결. 마이그레이션은 Session/Direct(포트 5432) 권장.
- **인증**: ASP.NET Core Identity **쿠키 기반** (`AddIdentityApiEndpoints` / `MapIdentityApi`). 브라우저는 Next.js하고만 통신하고, Next.js가 **HttpOnly 쿠키**를 API로 포워딩(BFF). 도메인 화이트리스트·계정 `status`가 커스텀 부분.
- **파일**: 오브젝트 스토리지(S3 호환 / Azure Blob); `attachments`에는 경로(key)만.
- **이메일**: 전용 발송 서비스(SMTP/SendGrid/ACS). 개발용은 `LoggingEmailSender`가 링크를 로그로 출력.
- **권한**: 최종 강제는 API `[Authorize]`(역할). 프론트 `src/proxy.ts` 가드는 UX 보조.

## 저장소 구조 (실제)

```
/backend    ASP.NET Core 10 Web API — Domain/(엔터티), Data/(DbContext·Migrations·DbSeeder), Api/(엔드포인트), Infrastructure/
/frontend   Next.js 16 — src/app 라우트 그룹 (marketing)/(auth)/(board)/(admin),
            BFF 프록시 src/app/api/[...path]/route.ts, 라우트 가드 src/proxy.ts, API 헬퍼 src/lib/api.ts
/docs       PRD.md, DESIGN.md
.claude/rules  code-style.md, git-rules.md
.editorconfig  스타일(들여쓰기 등) 강제
```

## 개발 명령 (검증됨)

- **백엔드** (리포 루트 기준):
  - 빌드: `dotnet build backend/backend.csproj`
  - 실행: `dotnet run --project backend --launch-profile http` → `http://localhost:5259` (BFF가 http로 프록시하므로 http 프로필 사용)
  - 포맷: `dotnet format whitespace backend/backend.csproj` (2칸 들여쓰기 적용)
  - 마이그레이션: `dotnet ef migrations add <Name> --project backend` / `dotnet ef database update --project backend`
  - 비밀 주입: `dotnet user-secrets set "ConnectionStrings:Default" "<supabase 연결문자열>" --project backend` (+ `Seed:AdminEmail`, `Seed:AdminPassword`)
  - 테스트: 아직 테스트 프로젝트 없음
- **프론트** (`frontend/` 기준):
  - 개발: `npm run dev` → `http://localhost:3000`
  - 빌드: `npm run build` / 린트: `npm run lint` (**커밋 전 필수**)
  - 환경: `.env.local`의 `BACKEND_API_URL=http://localhost:5259`

## 인증 / BFF 흐름

- 브라우저 → Next.js(`/api/*`는 `src/app/api/[...path]/route.ts`가 백엔드로 프록시, 인증 쿠키 포워딩) → ASP.NET Core API.
- Identity 쿠키 로그인은 `POST /api/auth/login?useCookies=true`. 로그아웃은 커스텀 `POST /api/auth/logout`.
- 보호 라우트 가드: `src/proxy.ts` (Next.js 16에서 middleware가 **proxy**로 개명). 최종 인가는 백엔드 `[Authorize]`.

## 데이터 모델 메모 (Identity 영향)

`docs/PRD.md` §5의 개념 모델을 EF Core 엔터티로 매핑하되, Identity 때문에 두 가지가 바뀐다.

- `users` → 커스텀 `ApplicationUser : IdentityUser` (email·비밀번호해시·이메일확인·잠금은 Identity 기본; `name`·`department`·`status`만 추가). 역할(`employee`/`admin`)은 Identity 역할 테이블.
- `auth_tokens` → **사용 안 함**. 이메일 확인·비밀번호 재설정 토큰은 Identity 토큰 공급자/`MapIdentityApi`가 처리.

나머지(`inquiries`, `board_categories`, `posts`, `comments`, `attachments`, `page_contents`, `email_logs`)는 일반 EF Core 엔터티.

## 확정된 스코프 결정

사용자와 합의된 사항 — 재론의 지시가 없는 한 고정으로 취급한다.

- **DB**: Supabase(관리형 PostgreSQL). 인증은 Supabase Auth가 아니라 **ASP.NET Core Identity** 사용.
- **직원 인증**: 회사 이메일 **도메인 화이트리스트** + 이메일 인증 방식의 **자체 가입**. 관리자 발급 계정·SSO는 v1 제외.
- **문의 처리**: DB 저장 + **관리자 페이지**(목록/상세/상태 `received → in_progress → done`/담당자/내부 메모) + 신규 접수 시 담당자 **이메일 알림**.
- **사내 게시판**: 댓글·파일 첨부·카테고리 분류·공지 고정·조회수 전부 포함.
- **소개 콘텐츠**: **하이브리드 CMS** — 핵심은 코드 고정, 지정 영역(인사말/배너/공지)만 `page_contents`로 관리자 편집.

## 작업 메모

- 프레임워크 버전·설정은 **Context7**로 현재 **.NET 10 / Next.js 16** 공식 문서를 확인한 뒤 진행(기억에만 의존하지 말 것). Next.js 16은 breaking change가 있어 `frontend/AGENTS.md`가 `node_modules/next/dist/docs/` 확인을 요구한다.
- 남은 결정(스토리지·이메일 제공자, 호스팅, 프론트↔API 배치)은 `docs/PRD.md` §9 참고 — 하드코딩 전에 사용자와 확정.
