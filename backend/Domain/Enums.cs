namespace backend.Domain;

/// <summary>사용자 계정 상태</summary>
public enum UserStatus
{
  Pending,    // 이메일 미인증
  Active,     // 활성
  Suspended   // 정지
}

/// <summary>문의 처리 상태</summary>
public enum InquiryStatus
{
  Received,     // 접수
  InProgress,   // 처리중
  Done          // 완료
}

/// <summary>이메일 발송 용도</summary>
public enum EmailType
{
  InquiryNotify,   // 문의 접수 담당자 알림
  Verify,          // 이메일 인증
  Reset            // 비밀번호 재설정
}

/// <summary>이메일 발송 결과</summary>
public enum EmailStatus
{
  Sent,
  Failed
}
