namespace backend.Domain;

/// <summary>
/// 편집 가능한 CMS 콘텐츠 키 화이트리스트 (하이브리드 CMS — 코드 고정 + 지정 영역만 관리자 편집). (PRD §5.8 / F-INT-02)
/// 여기 정의된 키만 시드·조회·편집이 허용된다.
/// </summary>
public static class PageContentKeys
{
  /// <summary>편집 영역 정의 — 키와 시드용 기본 제목·본문·노출여부</summary>
  public record Definition(string Key, string DefaultTitle, string DefaultBody, bool DefaultVisible);

  public static readonly IReadOnlyList<Definition> All =
  [
    new("greeting", "인사말", "안녕하세요. 저희 회사를 찾아주셔서 감사합니다.", true),
    new("main_banner", "메인 배너", "신뢰할 수 있는 파트너, 함께 성장하는 미래를 만듭니다.", true),
    // 공지는 기본 숨김 — 실제 공지가 있을 때만 관리자가 노출로 전환한다
    new("notice", "홈 공지", "현재 등록된 공지가 없습니다.", false),
  ];

  /// <summary>편집이 허용된 키인지 검사</summary>
  public static bool IsAllowed(string key) => All.Any(d => d.Key == key);
}
