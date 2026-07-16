# PRD: 회사 소개 홈페이지 + 문의 접수 + 사내 게시판

- 문서 버전: v0.2 (기술 스택 확정 반영)
- 작성일: 2026-07-16
- 상태: 검토용 초안
- 아키텍처 한 줄 요약: **Next.js 16 프론트엔드 + ASP.NET Core 10 Web API 백엔드 (쿠키 기반 Identity 인증)**

## 1. 개요

| 항목 | 내용 |
|---|---|
| 제품 한 줄 정의 | 외부 방문자에게 회사를 소개하고 문의를 접수하며, 내부 직원에게는 사내 소통 게시판을 제공하는 웹사이트 |
| 배경/문제 | 회사 소개·문의 채널이 없거나 분산되어 있고, 직원 간 공지·자료 공유 창구가 부재 |
| 목표 | ① 브랜드 신뢰를 주는 공개 소개 페이지 ② 문의를 놓치지 않는 접수·관리 체계 ③ 직원 전용 폐쇄형 게시판 |
| 성공 지표(예시) | 월 문의 접수 건수, 문의 평균 응답 시간, 사내 게시판 주간 활성 사용자(WAU), 게시글/댓글 수 |
| 범위 밖(Out of scope) | 전자상거래/결제, 채용 지원 시스템(ATS), 실시간 채팅, 모바일 네이티브 앱, 다국어(초기 한국어만) |

## 2. 대상 사용자

| 사용자 유형 | 설명 | 인증 | 주요 목적 |
|---|---|---|---|
| 방문자(잠재 고객) | 로그인 없이 접근하는 외부 사용자 | 불필요 | 회사/사업 정보 열람, 문의 제출 |
| 문의 고객 | 문의 폼을 제출한 외부 사용자 | 불필요 | 상담/견적 등 요청 전달 |
| 일반 직원 | 회사 이메일로 가입·인증한 내부 구성원 | 이메일 가입+인증 | 사내 게시판 열람/작성/댓글/파일 공유 |
| 관리자(Admin) | 문의·회원·콘텐츠·게시판을 운영하는 담당자 | 로그인(관리자 권한) | 문의 응대, 회원/콘텐츠/게시판 관리 |

> 관리자는 초기에는 단일 역할로 두되, ASP.NET Core Identity 역할(role)로 구분해 향후 세분화(콘텐츠 편집자/운영자 등) 가능하도록 설계.

## 3. 화면 목록 (사이트맵)

식별자 규칙: **P**=공개 영역, **E**=직원(로그인 필요), **A**=관리자 영역.

> 모든 화면은 **Next.js 프론트엔드**가 렌더링하며 ASP.NET Core API를 호출한다. 공개 영역(P-*)은 SEO를 위해 SSR/SSG로 렌더링하고, 직원·관리자 영역(E-*/A-*)은 로그인 후 접근하는 인터랙티브 UI로 구성한다.

### 3.1 공개 영역 (Public)

| ID | 화면 | 접근 | 설명 |
|---|---|---|---|
| P-01 | 메인/홈 | 누구나 | 히어로, 핵심 소개 요약, 주요 링크(문의/소개), 관리자 편집 배너 노출 |
| P-02 | 회사 소개 | 누구나 | 인사말·비전·연혁(핵심 고정 + 일부 관리자 편집 영역) |
| P-03 | 사업분야/서비스 | 누구나 | 제공 제품·서비스 소개 |
| P-04 | 오시는 길 | 누구나 | 주소, 지도, 연락처 |
| P-05 | 문의하기 | 누구나 | 문의 폼(이름/회사/이메일/연락처/유형/제목/내용, 개인정보 동의) |
| P-06 | 문의 완료 | 누구나 | 접수 완료 안내 및 접수번호 표시 |
| P-07 | 로그인 | 누구나 | 직원/관리자 공통 로그인 |
| P-08 | 회원가입(직원) | 누구나 | 회사 이메일로 가입, 도메인 검증 |
| P-09 | 이메일 인증 결과 | 누구나 | 인증 링크 클릭 후 성공/실패 안내 |
| P-10 | 비밀번호 재설정 | 누구나 | 재설정 요청 및 링크로 재설정 |

### 3.2 직원 영역 (로그인 필요, Employee)

| ID | 화면 | 접근 | 설명 |
|---|---|---|---|
| E-01 | 게시판 홈(카테고리) | 직원 | 카테고리 목록/최근 글, 공지 고정 노출 |
| E-02 | 게시글 목록 | 직원 | 카테고리별 목록, 검색/페이지네이션, 조회수 표시 |
| E-03 | 게시글 상세 | 직원 | 본문·첨부파일·댓글, 조회수 증가 |
| E-04 | 게시글 작성/수정 | 직원 | 제목/본문/카테고리/첨부, 본인 글만 수정·삭제 |
| E-05 | 내 프로필 | 직원 | 이름/부서/비밀번호 변경 |

### 3.3 관리자 영역 (Admin)

| ID | 화면 | 접근 | 설명 |
|---|---|---|---|
| A-01 | 관리자 대시보드 | 관리자 | 신규 문의/미처리 건수, 신규 가입 대기, 최근 게시글 요약 |
| A-02 | 문의 목록 | 관리자 | 상태/기간/검색 필터, 목록 |
| A-03 | 문의 상세·상태관리 | 관리자 | 내용 확인, 상태(접수→처리중→완료), 담당자 지정, 메모 |
| A-04 | 회원 관리 | 관리자 | 가입 승인/거절, 권한 변경, 정지/해제 |
| A-05 | 게시판 카테고리 관리 | 관리자 | 카테고리 생성/수정/정렬/삭제 |
| A-06 | 게시글·댓글 관리 | 관리자 | 부적절 글/댓글 삭제, 공지 고정 지정 |
| A-07 | 콘텐츠 편집 | 관리자 | 편집 가능 영역(인사말/배너/공지 등) 수정 |

## 4. 기능 요구사항

우선순위: **P0**=MVP 필수, **P1**=초기 출시 포함 권장, **P2**=향후.

### 4.1 회사 소개 / 공개 페이지

| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| F-INT-01 | 소개 페이지 노출 | 인사말/비전/연혁/사업분야 등 정적 페이지 렌더링 | P0 |
| F-INT-02 | 편집 가능 영역 | 관리자 지정 영역(배너/공지문/인사말 텍스트)을 CMS로 편집·반영 | P1 |
| F-INT-03 | 반응형 레이아웃 | 데스크톱/모바일 대응 | P0 |
| F-INT-04 | SEO 기본 | 페이지별 title/description, OG 태그, sitemap (Next.js SSR/SSG로 구현) | P1 |

### 4.2 문의 접수

| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| F-INQ-01 | 문의 제출 | 필수값 검증, 개인정보 수집 동의, 스팸 방지(허니팟/캡차) | P0 |
| F-INQ-02 | 접수 저장 | 문의를 DB에 저장, 접수번호 발급 | P0 |
| F-INQ-03 | 담당자 이메일 알림 | 신규 접수 시 지정 담당자에게 이메일 발송 | P0 |
| F-INQ-04 | 관리자 조회/검색 | 상태·기간·키워드 필터 목록 | P0 |
| F-INQ-05 | 상태 관리 | 접수/처리중/완료 상태 전환, 담당자 지정, 내부 메모 | P0 |
| F-INQ-06 | 접수 확인 메일(고객) | 제출자에게 접수 확인 자동 회신 | P2 |

### 4.3 인증 / 계정 (직원)

> **구현 참고:** 이 영역은 대부분 **ASP.NET Core Identity**가 기본 제공한다. `MapIdentityApi`가 가입·로그인·이메일확인·비밀번호재설정 엔드포인트를 제공하고, 비밀번호 해싱·계정 잠금(lockout)·역할이 내장된다. 커스텀으로 추가할 부분은 **회사 이메일 도메인 화이트리스트 검증**과 상태(승인/정지) 정도다.

| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| F-AUTH-01 | 회원가입 | 회사 이메일 도메인 화이트리스트 검증 후 가입 (Identity 등록 + 커스텀 도메인 검증) | P0 |
| F-AUTH-02 | 이메일 인증 | 인증 토큰 메일 발송, 링크 클릭 시 활성화 (Identity 이메일 확인 토큰) | P0 |
| F-AUTH-03 | 로그인/로그아웃 | 쿠키 기반 인증, 로그인 실패 제한 (Identity SignInManager + lockout) | P0 |
| F-AUTH-04 | 비밀번호 정책·해싱 | 최소 길이/복잡도, 안전한 해시 저장 (Identity 기본 제공) | P0 |
| F-AUTH-05 | 비밀번호 재설정 | 메일 링크로 재설정 (Identity 재설정 토큰) | P1 |
| F-AUTH-06 | 가입 승인(선택) | 관리자 승인 후 활성화하는 옵션 (`status` 필드로 제어) | P2 |

### 4.4 사내 게시판

| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| F-BRD-01 | 게시글 CRUD | 작성/조회/수정/삭제(본인 글) | P0 |
| F-BRD-02 | 카테고리 분류 | 카테고리별 작성·필터 | P0 |
| F-BRD-03 | 댓글 | 댓글 작성/삭제(본인) | P0 |
| F-BRD-04 | 파일 첨부 | 이미지/문서 업로드·다운로드, 형식·용량 제한 | P0 |
| F-BRD-05 | 공지 고정 | 관리자 지정 글 상단 고정 | P1 |
| F-BRD-06 | 조회수 | 상세 진입 시 조회수 증가·표시 | P1 |
| F-BRD-07 | 검색/페이지네이션 | 제목·본문 검색, 목록 페이징 | P1 |
| F-BRD-08 | 대댓글(선택) | 댓글의 답글 구조 | P2 |

### 4.5 관리자 / 공통

| ID | 기능 | 설명 | 우선순위 |
|---|---|---|---|
| F-ADM-01 | 회원 관리 | 목록/권한 변경/정지·해제 | P0 |
| F-ADM-02 | 게시판 관리 | 카테고리 관리, 부적절 글·댓글 삭제 | P1 |
| F-ADM-03 | 콘텐츠 편집 | 편집 영역 텍스트/배너 수정 | P1 |
| F-CMN-01 | 권한 제어 | 역할 기반 접근제어(RBAC), 미인증 접근 차단 (Identity 역할 + `[Authorize]`) | P0 |
| F-CMN-02 | 감사/로그(선택) | 관리자 주요 활동 로그 | P2 |

## 5. 데이터 모델

> **구현 기준(ASP.NET Core Identity + EF Core):** 아래 개념 모델을 EF Core 엔터티로 매핑한다. 단, `users`는 `ApplicationUser : IdentityUser`로 확장하고(이메일·비밀번호해시·이메일확인·잠금 등은 Identity 기본 컬럼), 역할은 Identity 역할 테이블(`AspNetRoles`/`AspNetUserRoles`)을 사용한다. `auth_tokens`는 Identity 토큰 공급자가 대체하므로 **별도 테이블이 불필요**하다.

### 5.1 users (사용자) — `ApplicationUser : IdentityUser` 로 구현

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | Identity 기본 키 (문자열 GUID) |
| email | string, unique | 회사 이메일(로그인 ID) — *Identity 기본 제공* |
| password_hash | string | 해시된 비밀번호 — *Identity 기본 제공* |
| email_confirmed | bool | 이메일 인증 여부 — *Identity 기본 제공* |
| lockout / access_failed_count | — | 로그인 실패 제한 — *Identity 기본 제공* |
| name | string | 이름 — *커스텀 추가* |
| department | string, null | 부서 — *커스텀 추가* |
| status | enum | pending(미인증) / active / suspended — *커스텀 추가* |
| role | (Identity 역할) | employee / admin — *`AspNetRoles`로 관리* |
| created_at / updated_at | datetime | 생성·수정 |

### 5.2 auth_tokens — 사용 안 함 (Identity로 대체)

이메일 확인·비밀번호 재설정 토큰은 ASP.NET Core Identity의 토큰 공급자와 `MapIdentityApi` 엔드포인트가 처리한다. 별도 커스텀 테이블은 두지 않는다(특수 요건이 생기면 그때 추가).

### 5.3 inquiries (문의)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 문의 ID(접수번호) |
| name | string | 제출자 이름 |
| company | string, null | 회사명 |
| email | string | 회신 이메일 |
| phone | string, null | 연락처 |
| category | string, null | 문의 유형 |
| title | string | 제목 |
| message | text | 문의 내용 |
| status | enum | received / in_progress / done |
| assigned_admin_id | FK→users, null | 담당 관리자 |
| admin_memo | text, null | 내부 처리 메모 |
| privacy_consent | bool | 개인정보 수집 동의 |
| created_ip | string, null | 접수 IP(스팸 대응) |
| created_at / updated_at | datetime | 생성·수정 |

### 5.4 board_categories (게시판 카테고리)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 카테고리 ID |
| name | string | 이름(예: 공지, 자유, 부서) |
| slug | string, unique | URL 식별자 |
| sort_order | int | 정렬 순서 |
| created_at | datetime | 생성 |

### 5.5 posts (게시글)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 게시글 ID |
| category_id | FK→board_categories | 카테고리 |
| author_id | FK→users | 작성자 |
| title | string | 제목 |
| body | text | 본문 |
| is_pinned | bool | 공지 고정 여부 |
| view_count | int | 조회수 |
| is_deleted | bool | 소프트 삭제 |
| created_at / updated_at | datetime | 생성·수정 |

### 5.6 comments (댓글)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 댓글 ID |
| post_id | FK→posts | 대상 게시글 |
| author_id | FK→users | 작성자 |
| parent_comment_id | FK→comments, null | 대댓글용(선택) |
| body | text | 내용 |
| is_deleted | bool | 소프트 삭제 |
| created_at / updated_at | datetime | 생성·수정 |

### 5.7 attachments (첨부파일)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 첨부 ID |
| post_id | FK→posts | 소속 게시글 |
| original_name | string | 원본 파일명 |
| stored_path | string | 저장 경로/키 (오브젝트 스토리지, 파일 자체는 DB에 저장하지 않음) |
| mime_type | string | 파일 형식 |
| size_bytes | int | 크기 |
| uploaded_by | FK→users | 업로더 |
| created_at | datetime | 생성 |

### 5.8 page_contents (편집 가능 콘텐츠 — 하이브리드 CMS)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 콘텐츠 ID |
| key | string, unique | 위치 식별자(예: greeting, main_banner, notice) |
| title | string, null | 제목 |
| body | text | 본문(HTML/마크다운) |
| updated_by | FK→users, null | 최종 수정자 |
| updated_at | datetime | 수정 시각 |

### 5.9 email_logs (알림 발송 로그, 선택)

| 필드 | 타입 | 설명 |
|---|---|---|
| id | PK | 로그 ID |
| type | enum | inquiry_notify / verify / reset |
| recipient | string | 수신자 |
| subject | string | 제목 |
| status | enum | sent / failed |
| related_inquiry_id | FK→inquiries, null | 관련 문의 |
| created_at | datetime | 생성 |

### 5.10 관계 요약

- users 1—N posts / comments / attachments / inquiries(담당)
- board_categories 1—N posts
- posts 1—N comments / attachments
- 인증 토큰은 Identity가 관리 (커스텀 테이블 없음)

## 6. 권한 매트릭스

접근제어는 ASP.NET Core Identity 역할 + `[Authorize(Roles = ...)]` (API) / Next.js 라우트 가드 (프론트)로 이중 적용한다.

| 기능/영역 | 방문자 | 직원 | 관리자 |
|---|:---:|:---:|:---:|
| 공개 소개 페이지 열람 | ✅ | ✅ | ✅ |
| 문의 제출 | ✅ | ✅ | ✅ |
| 문의 조회·상태관리 | ❌ | ❌ | ✅ |
| 게시판 열람/작성/댓글 | ❌ | ✅ | ✅ |
| 게시글 수정·삭제 | ❌ | 본인만 | 전체 |
| 공지 고정 | ❌ | ❌ | ✅ |
| 회원/카테고리/콘텐츠 관리 | ❌ | ❌ | ✅ |

## 7. 비기능 요구사항

| 구분 | 요구사항 |
|---|---|
| 보안 | 비밀번호 해싱(Identity), 이메일 도메인 화이트리스트, 파일 업로드 형식/용량 검증, XSS/CSRF 방어, **HttpOnly·SameSite 쿠키 세션** |
| 인증 아키텍처 | 브라우저는 토큰을 직접 보관하지 않음(쿠키 기반). 프론트↔API 동일 사이트 구성 또는 Next.js BFF 프록시로 CORS·쿠키 문제 최소화 (§8 참고) |
| 개인정보 | 문의·회원 정보 수집 동의, 보관 기간·파기 정책, 접근 최소화 |
| 성능 | 목록 페이지네이션, 이미지 최적화, 기본 캐싱 |
| 접근성/반응형 | 모바일 대응, 기본 웹 접근성 준수 |
| 운영 | 문의/가입 알림 메일, 오류 로깅, 백업 정책 |

## 8. 기술 스택 및 시스템 아키텍처

### 8.1 구성도

```
[브라우저]
   │  (HTTPS, HttpOnly 쿠키)
   ▼
[Next.js 16 프론트엔드]  ── SSR/SSG(공개 페이지, SEO) + 게시판/관리자 UI + BFF 프록시
   │  (서버 간 호출, 인증 쿠키 전달)
   ▼
[ASP.NET Core 10 Web API]  ── 비즈니스 로직 · 인증(Identity) · 권한
   │                         ├─▶ [오브젝트 스토리지]  첨부파일
   ▼                         └─▶ [이메일 서비스]      인증·알림 메일
[PostgreSQL]  (EF Core)
```

### 8.2 스택

| 계층 | 기술 | 역할 |
|---|---|---|
| 프론트엔드 | **Next.js 16** (App Router, React, TypeScript) | 공개 페이지 SSR/SSG(SEO), 게시판·관리자 UI, API 프록시(BFF) |
| 스타일 | Tailwind CSS (+ shadcn/ui 선택) | 반응형 UI |
| 백엔드 API | **ASP.NET Core 10** Web API (C#) | REST API, 비즈니스 로직 |
| 인증 | **ASP.NET Core Identity** (쿠키 기반, `AddIdentityApiEndpoints`/`MapIdentityApi`) | 가입/로그인/이메일확인/재설정/역할/잠금 |
| ORM | **Entity Framework Core** (+ Npgsql) | 데이터 접근·마이그레이션 |
| DB | **PostgreSQL** | 관계형 데이터 (SQL Server로 대체 가능) |
| 파일 저장 | S3 호환(Cloudflare R2 / AWS S3) 또는 Azure Blob | 첨부파일(경로만 DB 저장) |
| 이메일 | SMTP(MailKit) / SendGrid / Azure Communication Services | 인증·알림 메일 |
| 배포 | 프론트: Vercel 또는 Node 호스트 · API: Azure App Service 또는 Docker | — |

### 8.3 인증 흐름 (핵심 결정)

- **쿠키 기반 인증**을 채택한다. ASP.NET Core Identity가 로그인 시 **HttpOnly 쿠키**를 발급하고, 브라우저가 자동으로 전송한다. 토큰을 JavaScript에 노출하지 않아 XSS에 안전하다. (공식 문서 권장 방식)
- 브라우저는 **Next.js하고만 통신**하고, Next.js가 서버에서 ASP.NET Core API로 요청을 프록시하며 인증 쿠키를 전달한다(**BFF 패턴**). 프론트와 API를 동일 사이트로 배치하면 CORS·크로스사이트 쿠키 문제가 최소화된다.
- `MapIdentityApi`가 register / login(`?useCookies=true`) / refresh / confirmEmail / resetPassword 엔드포인트를 제공한다.
- **베어러 토큰**은 향후 모바일 등 쿠키를 쓰지 못하는 클라이언트를 위한 대안으로만 남겨둔다.

### 8.4 저장소 구조(예정)

```
/backend    ASP.NET Core 10 Web API (C#, EF Core, Identity)
/frontend   Next.js 16 앱 (App Router, TypeScript)
```

## 9. 남은 결정 및 가정

| 항목 | 현재 가정 | 확정 필요 |
|---|---|---|
| DB 제품 | **Supabase(관리형 PostgreSQL) 확정** | 연결 문자열 주입(user-secrets), 마이그레이션 적용 |
| 파일 저장소 | S3 호환 오브젝트 스토리지 | 구체 제공자·버킷·용량 정책 |
| 이메일 제공자 | 전용 발송 서비스 | SendGrid / SES / Azure / SMTP 중 선정 |
| 배포/호스팅 | 프론트 Vercel·API Azure/Docker | 실제 인프라 확정 |
| 프론트↔API 배치 | 동일 사이트 또는 BFF 프록시 | 도메인·리버스 프록시 구성 확정 |
| 관리자 세분화 | 단일 admin 역할 | 편집자/운영자 분리 여부 |
