namespace backend.Domain;

/// <summary>고객 문의 (PRD §5.3)</summary>
public class Inquiry
{
  public int Id { get; set; }                       // 접수번호
  public string Name { get; set; } = string.Empty;
  public string? Company { get; set; }
  public string Email { get; set; } = string.Empty;
  public string? Phone { get; set; }
  public string? Category { get; set; }             // 문의 유형
  public string Title { get; set; } = string.Empty;
  public string Message { get; set; } = string.Empty;
  public InquiryStatus Status { get; set; } = InquiryStatus.Received;

  public string? AssignedAdminId { get; set; }      // 담당 관리자
  public ApplicationUser? AssignedAdmin { get; set; }
  public string? AdminMemo { get; set; }            // 내부 처리 메모

  public bool PrivacyConsent { get; set; }
  public string? CreatedIp { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>게시판 카테고리 (PRD §5.4)</summary>
public class Category
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public string Slug { get; set; } = string.Empty;  // URL 식별자 (유니크)
  public int SortOrder { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

  public ICollection<Post> Posts { get; set; } = new List<Post>();
}

/// <summary>게시글 (PRD §5.5)</summary>
public class Post
{
  public int Id { get; set; }
  public int CategoryId { get; set; }
  public Category? Category { get; set; }
  public string AuthorId { get; set; } = string.Empty;
  public ApplicationUser? Author { get; set; }

  public string Title { get; set; } = string.Empty;
  public string Body { get; set; } = string.Empty;
  public bool IsPinned { get; set; }                // 공지 고정
  public int ViewCount { get; set; }                // 조회수
  public bool IsDeleted { get; set; }               // 소프트 삭제
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

  public ICollection<Comment> Comments { get; set; } = new List<Comment>();
  public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}

/// <summary>댓글 (PRD §5.6)</summary>
public class Comment
{
  public int Id { get; set; }
  public int PostId { get; set; }
  public Post? Post { get; set; }
  public string AuthorId { get; set; } = string.Empty;
  public ApplicationUser? Author { get; set; }

  public int? ParentCommentId { get; set; }         // 대댓글용(선택)
  public Comment? Parent { get; set; }

  public string Body { get; set; } = string.Empty;
  public bool IsDeleted { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
  public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>첨부파일 — 바이너리는 오브젝트 스토리지, DB에는 경로만 (PRD §5.7)</summary>
public class Attachment
{
  public int Id { get; set; }
  public int PostId { get; set; }
  public Post? Post { get; set; }

  public string OriginalName { get; set; } = string.Empty;
  public string StoredPath { get; set; } = string.Empty;   // 스토리지 key
  public string MimeType { get; set; } = string.Empty;
  public long SizeBytes { get; set; }

  public string UploadedById { get; set; } = string.Empty;
  public ApplicationUser? UploadedBy { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>편집 가능 콘텐츠 — 하이브리드 CMS (PRD §5.8)</summary>
public class PageContent
{
  public int Id { get; set; }
  public string Key { get; set; } = string.Empty;   // 위치 식별자 (유니크): greeting, main_banner, notice ...
  public string? Title { get; set; }
  public string Body { get; set; } = string.Empty;

  public string? UpdatedById { get; set; }
  public ApplicationUser? UpdatedBy { get; set; }
  public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>이메일 발송 로그 (PRD §5.9)</summary>
public class EmailLog
{
  public int Id { get; set; }
  public EmailType Type { get; set; }
  public string Recipient { get; set; } = string.Empty;
  public string Subject { get; set; } = string.Empty;
  public EmailStatus Status { get; set; }

  public int? RelatedInquiryId { get; set; }
  public Inquiry? RelatedInquiry { get; set; }
  public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
