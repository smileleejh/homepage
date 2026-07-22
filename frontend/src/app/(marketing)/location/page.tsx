import type { Metadata } from "next";

export const metadata: Metadata = { title: "오시는 길" };

// P-04 오시는 길
export default function LocationPage() {
  const info = [
    { label: "주소", value: "서울특별시 ○○구 ○○로 123, 4층" },
    { label: "전화", value: "02-1234-5678" },
    { label: "이메일", value: "contact@company.com" },
    { label: "운영시간", value: "평일 09:00 – 18:00 (주말·공휴일 휴무)" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <span className="eyebrow">Location</span>
      <h1 className="mt-3 text-4xl font-bold">오시는 길</h1>
      <div className="mt-5 h-1 w-12 rounded-full bg-linear-to-r from-indigo-600 to-violet-600" />

      <div className="mt-14 grid gap-8 lg:grid-cols-5">
        {/* 지도 영역 (플레이스홀더) */}
        <div className="lg:col-span-3">
          <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-100 to-slate-200 text-slate-400 shadow-sm">
            <div className="text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto h-10 w-10"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p className="mt-2 text-sm font-medium">지도 영역</p>
            </div>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="card lg:col-span-2">
          <dl className="divide-y divide-slate-100">
            {info.map((row) => (
              <div key={row.label} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                <dt className="w-20 shrink-0 text-sm font-semibold text-slate-900">
                  {row.label}
                </dt>
                <dd className="text-sm leading-relaxed text-slate-600">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
