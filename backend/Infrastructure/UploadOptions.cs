namespace backend.Infrastructure;

/// <summary>
/// 첨부파일 업로드 제한 설정 (F-BRD-04). appsettings의 Upload 섹션에 대응한다.
/// 용량·개수만 설정으로 조정하고, 허용 형식은 <see cref="AttachmentTypes"/>의
/// 확장자→MIME 화이트리스트로 코드에 고정한다 — 형식을 늘리려면 다운로드 시 서빙할
/// MIME을 함께 정해야 하므로 설정만으로 열리면 안 된다.
/// </summary>
public class UploadOptions
{
  public const string SectionName = "Upload";

  /// <summary>파일 1개당 최대 크기(바이트). 기본 10MB.</summary>
  public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

  /// <summary>게시글 1건당 첨부 최대 개수(기존 첨부 포함). 기본 10개.</summary>
  public int MaxFilesPerPost { get; set; } = 10;

  /// <summary>요청 본문 전체 한도 — 한 번에 최대 개수만큼 올리는 경우를 허용한다.</summary>
  public long MaxRequestBodyBytes => MaxFileSizeBytes * MaxFilesPerPost;
}

/// <summary>
/// 첨부파일 형식 화이트리스트와 검증 (F-BRD-04 · DESIGN §4.6).
/// </summary>
public static class AttachmentTypes
{
  /// <summary>
  /// 허용 확장자 → 저장·서빙에 사용할 MIME.
  /// 브라우저가 보낸 Content-Type은 신뢰하지 않는다. 위장 업로드(예: 확장자는 .png인데
  /// Content-Type이 text/html)를 그대로 저장하면 다운로드 시 브라우저가 해석해
  /// 스크립트가 실행될 수 있으므로, 확장자에서 유도한 MIME으로 덮어쓴다.
  /// </summary>
  public static readonly IReadOnlyDictionary<string, string> ByExtension =
      new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
      {
        // 이미지
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".gif"] = "image/gif",
        [".webp"] = "image/webp",
        // 문서
        [".pdf"] = "application/pdf",
        [".txt"] = "text/plain; charset=utf-8",
        [".csv"] = "text/csv; charset=utf-8",
        [".doc"] = "application/msword",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".xls"] = "application/vnd.ms-excel",
        [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".ppt"] = "application/vnd.ms-powerpoint",
        [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        [".hwp"] = "application/x-hwp",
        [".hwpx"] = "application/hwp+zip",
        // 압축
        [".zip"] = "application/zip",
      };

  /// <summary>안내 문구·프론트 accept 속성에 쓸 허용 확장자 목록(정렬).</summary>
  public static IReadOnlyList<string> AllowedExtensions { get; } =
      ByExtension.Keys.OrderBy(e => e, StringComparer.Ordinal).ToList();

  /// <summary>확장자에서 저장·서빙용 MIME을 구한다. 화이트리스트에 없으면 null.</summary>
  public static string? ResolveMimeType(string fileName)
  {
    var ext = Path.GetExtension(fileName);
    return !string.IsNullOrEmpty(ext) && ByExtension.TryGetValue(ext, out var mime) ? mime : null;
  }

  /// <summary>
  /// 파일 1개 검증. 문제가 있으면 사용자에게 보여줄 사유를, 통과하면 null을 반환한다.
  /// </summary>
  public static string? Validate(IFormFile file, UploadOptions options)
  {
    // 경로 요소를 떼어낸 순수 파일명으로만 판단한다(브라우저가 전체 경로를 보내는 경우 대비)
    var name = Path.GetFileName(file.FileName);
    if (string.IsNullOrWhiteSpace(name))
    {
      return "파일 이름이 없습니다.";
    }

    if (file.Length <= 0)
    {
      return $"'{name}': 빈 파일은 업로드할 수 없습니다.";
    }

    if (file.Length > options.MaxFileSizeBytes)
    {
      return $"'{name}': 파일당 최대 {FormatSize(options.MaxFileSizeBytes)}까지 업로드할 수 있습니다.";
    }

    if (ResolveMimeType(name) is null)
    {
      return $"'{name}': 허용되지 않는 형식입니다. (허용: {string.Join(" ", AllowedExtensions)})";
    }

    return null;
  }

  /// <summary>사람이 읽는 용량 표기(안내 문구용).</summary>
  public static string FormatSize(long bytes) => bytes switch
  {
    >= 1024 * 1024 => $"{bytes / (1024.0 * 1024):0.#}MB",
    >= 1024 => $"{bytes / 1024.0:0.#}KB",
    _ => $"{bytes}B",
  };
}
