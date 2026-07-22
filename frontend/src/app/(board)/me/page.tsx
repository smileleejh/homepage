// E-05 내 프로필 (이름/부서/비밀번호 변경)
export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <span className="eyebrow">My account</span>
        <h1 className="mt-2 text-3xl font-bold">내 프로필</h1>
        <p className="mt-2 text-slate-600">이름 · 부서 · 비밀번호 변경 영역입니다.</p>
      </div>

      {/* 기본 정보 */}
      <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold">기본 정보</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900">이름</label>
            <input placeholder="이름" className="field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900">부서</label>
            <input placeholder="부서" className="field" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary px-6! py-2.5!">
            저장
          </button>
        </div>
      </form>

      {/* 비밀번호 변경 */}
      <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold">비밀번호 변경</h2>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-900">
            현재 비밀번호
          </label>
          <input type="password" placeholder="현재 비밀번호" className="field" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900">
              새 비밀번호
            </label>
            <input type="password" placeholder="새 비밀번호" className="field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-900">
              새 비밀번호 확인
            </label>
            <input type="password" placeholder="새 비밀번호 확인" className="field" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn btn-accent px-6! py-2.5!">
            변경
          </button>
        </div>
      </form>
    </div>
  );
}
