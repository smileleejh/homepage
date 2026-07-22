import Link from "next/link";

// 인증 영역 공통 셸 (가운데 정렬 카드 + 은은한 배경)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-slate-50 px-6 py-16">
      {/* 배경 광원 효과 */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-200/50 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-xl font-extrabold text-slate-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30">
            C
          </span>
          COMPANY
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
