// 관리자 화면 공통 상태 배지·라벨 (문의 상태 / 회원 상태)

// 문의 처리 상태 (Received / InProgress / Done)
export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  Received: "접수",
  InProgress: "처리중",
  Done: "완료",
};

const INQUIRY_STATUS_CLASS: Record<string, string> = {
  Received: "bg-amber-50 text-amber-700",
  InProgress: "bg-indigo-50 text-indigo-700",
  Done: "bg-emerald-50 text-emerald-700",
};

export function InquiryStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        INQUIRY_STATUS_CLASS[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {INQUIRY_STATUS_LABEL[status] ?? status}
    </span>
  );
}

// 회원 계정 상태 (Pending / Active / Suspended)
export const MEMBER_STATUS_LABEL: Record<string, string> = {
  Pending: "미인증",
  Active: "활성",
  Suspended: "정지",
};

const MEMBER_STATUS_CLASS: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Active: "bg-emerald-50 text-emerald-700",
  Suspended: "bg-rose-50 text-rose-700",
};

export function MemberStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        MEMBER_STATUS_CLASS[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {MEMBER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
