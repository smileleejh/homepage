import type { Metadata } from "next";

export const metadata: Metadata = { title: "사업분야" };

// P-03 사업분야/서비스
export default function ServicesPage() {
  const services = [
    { title: "컨설팅", desc: "비즈니스 목표에 맞춘 전략과 실행 방안을 제안합니다." },
    { title: "솔루션 개발", desc: "요구사항에 최적화된 맞춤형 소프트웨어를 구축합니다." },
    { title: "운영 · 지원", desc: "안정적인 서비스 운영과 지속적인 개선을 지원합니다." },
    { title: "데이터 분석", desc: "데이터 기반 인사이트로 더 나은 의사결정을 돕습니다." },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <span className="eyebrow">Services</span>
      <h1 className="mt-3 text-4xl font-bold">사업분야</h1>
      <div className="mt-5 h-1 w-12 rounded-full bg-linear-to-r from-indigo-600 to-violet-600" />
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-600">
        제공하는 제품과 서비스를 소개하는 영역입니다.
      </p>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {services.map((s, i) => (
          <div key={s.title} className="card flex gap-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-600/25">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
