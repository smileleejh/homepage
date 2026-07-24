import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 크롤러 접근 규칙. 공개 페이지는 허용하고, 보호 영역·인증 화면·BFF는 색인에서 제외한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/", // BFF 프록시
        "/admin", // 관리자 영역
        "/board", // 직원 전용 게시판
        "/me", // 내 프로필
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/contact/complete", // 접수 결과 페이지
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
