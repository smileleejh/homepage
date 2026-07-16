// E-03 게시글 상세 (본문·첨부·댓글, 조회수 증가)
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ category: string; postId: string }>;
}) {
  const { postId } = await params;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">게시글 상세</h1>
      <p className="text-gray-600">게시글 #{postId} — 본문 · 첨부파일 · 댓글 영역.</p>
    </section>
  );
}
