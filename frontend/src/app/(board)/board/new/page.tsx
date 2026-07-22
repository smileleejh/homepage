import PostForm from "../../_components/PostForm";
import { BOARD_CATEGORIES } from "@/lib/board";

// E-04 글쓰기 — 서버에서 ?category= 를 읽어 유효하면 프리셀렉트로 전달
export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory = BOARD_CATEGORIES.some((c) => c.slug === category)
    ? category!
    : "";

  return <PostForm mode="create" initialCategory={initialCategory} />;
}
