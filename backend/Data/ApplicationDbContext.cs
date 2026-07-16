using backend.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

/// <summary>
/// EF Core DbContext. IdentityDbContext를 상속해 Identity 테이블(AspNetUsers/Roles 등)과
/// 도메인 엔터티를 함께 관리한다.
/// </summary>
public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser>(options)
{
  public DbSet<Inquiry> Inquiries => Set<Inquiry>();
  public DbSet<Category> Categories => Set<Category>();
  public DbSet<Post> Posts => Set<Post>();
  public DbSet<Comment> Comments => Set<Comment>();
  public DbSet<Attachment> Attachments => Set<Attachment>();
  public DbSet<PageContent> PageContents => Set<PageContent>();
  public DbSet<EmailLog> EmailLogs => Set<EmailLog>();

  protected override void OnModelCreating(ModelBuilder builder)
  {
    base.OnModelCreating(builder);   // Identity 스키마

    // enum → 문자열 저장(DB 가독성)
    builder.Entity<ApplicationUser>().Property(u => u.Status).HasConversion<string>();
    builder.Entity<Inquiry>().Property(i => i.Status).HasConversion<string>();
    builder.Entity<EmailLog>().Property(e => e.Type).HasConversion<string>();
    builder.Entity<EmailLog>().Property(e => e.Status).HasConversion<string>();

    // 유니크 인덱스
    builder.Entity<Category>().HasIndex(c => c.Slug).IsUnique();
    builder.Entity<PageContent>().HasIndex(p => p.Key).IsUnique();

    // 게시판 관계 및 삭제 동작
    builder.Entity<Post>()
        .HasOne(p => p.Category).WithMany(c => c.Posts)
        .HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);
    builder.Entity<Comment>()
        .HasOne(c => c.Post).WithMany(p => p.Comments)
        .HasForeignKey(c => c.PostId).OnDelete(DeleteBehavior.Cascade);
    builder.Entity<Comment>()
        .HasOne(c => c.Parent).WithMany()
        .HasForeignKey(c => c.ParentCommentId).OnDelete(DeleteBehavior.Restrict);
    builder.Entity<Attachment>()
        .HasOne(a => a.Post).WithMany(p => p.Attachments)
        .HasForeignKey(a => a.PostId).OnDelete(DeleteBehavior.Cascade);

    // 사용자(작성자/담당자) 관계 — 사용자 삭제가 데이터를 연쇄 삭제하지 않도록 제한
    builder.Entity<Post>()
        .HasOne(p => p.Author).WithMany()
        .HasForeignKey(p => p.AuthorId).OnDelete(DeleteBehavior.Restrict);
    builder.Entity<Comment>()
        .HasOne(c => c.Author).WithMany()
        .HasForeignKey(c => c.AuthorId).OnDelete(DeleteBehavior.Restrict);
    builder.Entity<Attachment>()
        .HasOne(a => a.UploadedBy).WithMany()
        .HasForeignKey(a => a.UploadedById).OnDelete(DeleteBehavior.Restrict);
    builder.Entity<Inquiry>()
        .HasOne(i => i.AssignedAdmin).WithMany()
        .HasForeignKey(i => i.AssignedAdminId).OnDelete(DeleteBehavior.SetNull);
    builder.Entity<PageContent>()
        .HasOne(p => p.UpdatedBy).WithMany()
        .HasForeignKey(p => p.UpdatedById).OnDelete(DeleteBehavior.SetNull);
  }
}
