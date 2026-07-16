// A-03 문의 상세·상태관리 (상태 전환/담당자/메모)
export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">문의 상세</h1>
      <p className="text-gray-600">문의 #{id} — 상태(접수→처리중→완료) · 담당자 지정 · 내부 메모.</p>
    </section>
  );
}
