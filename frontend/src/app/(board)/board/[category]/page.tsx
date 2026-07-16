// E-02 게시글 목록 (카테고리별, 검색/페이지네이션, 조회수)
export default async function PostListPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">게시글 목록</h1>
      <p className="text-gray-600">카테고리: {category}</p>
    </section>
  );
}
