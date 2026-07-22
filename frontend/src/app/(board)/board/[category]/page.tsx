import PostListView from "../../_components/PostListView";

// E-02 게시글 목록 — 서버에서 params/searchParams를 읽어 클라이언트 뷰에 전달
export default async function PostListPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category } = await params;
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  return <PostListView category={category} page={currentPage} />;
}
