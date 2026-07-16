// 인증 영역 공통 셸 (가운데 정렬 카드)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-6">
      {children}
    </div>
  );
}
