import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 검색엔진에 노출할 공개(marketing) 페이지만 등록한다.
// 게시판·관리자·인증 화면은 색인 대상이 아니므로 제외한다(robots.ts에서도 Disallow).
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/about", changeFrequency: "monthly", priority: 0.8 },
    { path: "/services", changeFrequency: "monthly", priority: 0.8 },
    { path: "/location", changeFrequency: "yearly", priority: 0.5 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
