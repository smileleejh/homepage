using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Data.Migrations
{
  /// <inheritdoc />
  public partial class InitialCreate : Migration
  {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.CreateTable(
          name: "AspNetRoles",
          columns: table => new
          {
            Id = table.Column<string>(type: "text", nullable: false),
            Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
            NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
            ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetRoles", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "AspNetUsers",
          columns: table => new
          {
            Id = table.Column<string>(type: "text", nullable: false),
            Name = table.Column<string>(type: "text", nullable: false),
            Department = table.Column<string>(type: "text", nullable: true),
            Status = table.Column<string>(type: "text", nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
            NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
            Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
            NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
            EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
            PasswordHash = table.Column<string>(type: "text", nullable: true),
            SecurityStamp = table.Column<string>(type: "text", nullable: true),
            ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
            PhoneNumber = table.Column<string>(type: "text", nullable: true),
            PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
            TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
            LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
            AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetUsers", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "Categories",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            Name = table.Column<string>(type: "text", nullable: false),
            Slug = table.Column<string>(type: "text", nullable: false),
            SortOrder = table.Column<int>(type: "integer", nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Categories", x => x.Id);
          });

      migrationBuilder.CreateTable(
          name: "AspNetRoleClaims",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            RoleId = table.Column<string>(type: "text", nullable: false),
            ClaimType = table.Column<string>(type: "text", nullable: true),
            ClaimValue = table.Column<string>(type: "text", nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
            table.ForeignKey(
                      name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                      column: x => x.RoleId,
                      principalTable: "AspNetRoles",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "AspNetUserClaims",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            UserId = table.Column<string>(type: "text", nullable: false),
            ClaimType = table.Column<string>(type: "text", nullable: true),
            ClaimValue = table.Column<string>(type: "text", nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
            table.ForeignKey(
                      name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                      column: x => x.UserId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "AspNetUserLogins",
          columns: table => new
          {
            LoginProvider = table.Column<string>(type: "text", nullable: false),
            ProviderKey = table.Column<string>(type: "text", nullable: false),
            ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
            UserId = table.Column<string>(type: "text", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
            table.ForeignKey(
                      name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                      column: x => x.UserId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "AspNetUserRoles",
          columns: table => new
          {
            UserId = table.Column<string>(type: "text", nullable: false),
            RoleId = table.Column<string>(type: "text", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
            table.ForeignKey(
                      name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                      column: x => x.RoleId,
                      principalTable: "AspNetRoles",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
            table.ForeignKey(
                      name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                      column: x => x.UserId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "AspNetUserTokens",
          columns: table => new
          {
            UserId = table.Column<string>(type: "text", nullable: false),
            LoginProvider = table.Column<string>(type: "text", nullable: false),
            Name = table.Column<string>(type: "text", nullable: false),
            Value = table.Column<string>(type: "text", nullable: true)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
            table.ForeignKey(
                      name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                      column: x => x.UserId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "Inquiries",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            Name = table.Column<string>(type: "text", nullable: false),
            Company = table.Column<string>(type: "text", nullable: true),
            Email = table.Column<string>(type: "text", nullable: false),
            Phone = table.Column<string>(type: "text", nullable: true),
            Category = table.Column<string>(type: "text", nullable: true),
            Title = table.Column<string>(type: "text", nullable: false),
            Message = table.Column<string>(type: "text", nullable: false),
            Status = table.Column<string>(type: "text", nullable: false),
            AssignedAdminId = table.Column<string>(type: "text", nullable: true),
            AdminMemo = table.Column<string>(type: "text", nullable: true),
            PrivacyConsent = table.Column<bool>(type: "boolean", nullable: false),
            CreatedIp = table.Column<string>(type: "text", nullable: true),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Inquiries", x => x.Id);
            table.ForeignKey(
                      name: "FK_Inquiries_AspNetUsers_AssignedAdminId",
                      column: x => x.AssignedAdminId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.SetNull);
          });

      migrationBuilder.CreateTable(
          name: "PageContents",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            Key = table.Column<string>(type: "text", nullable: false),
            Title = table.Column<string>(type: "text", nullable: true),
            Body = table.Column<string>(type: "text", nullable: false),
            UpdatedById = table.Column<string>(type: "text", nullable: true),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_PageContents", x => x.Id);
            table.ForeignKey(
                      name: "FK_PageContents_AspNetUsers_UpdatedById",
                      column: x => x.UpdatedById,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.SetNull);
          });

      migrationBuilder.CreateTable(
          name: "Posts",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            CategoryId = table.Column<int>(type: "integer", nullable: false),
            AuthorId = table.Column<string>(type: "text", nullable: false),
            Title = table.Column<string>(type: "text", nullable: false),
            Body = table.Column<string>(type: "text", nullable: false),
            IsPinned = table.Column<bool>(type: "boolean", nullable: false),
            ViewCount = table.Column<int>(type: "integer", nullable: false),
            IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Posts", x => x.Id);
            table.ForeignKey(
                      name: "FK_Posts_AspNetUsers_AuthorId",
                      column: x => x.AuthorId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Restrict);
            table.ForeignKey(
                      name: "FK_Posts_Categories_CategoryId",
                      column: x => x.CategoryId,
                      principalTable: "Categories",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Restrict);
          });

      migrationBuilder.CreateTable(
          name: "EmailLogs",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            Type = table.Column<string>(type: "text", nullable: false),
            Recipient = table.Column<string>(type: "text", nullable: false),
            Subject = table.Column<string>(type: "text", nullable: false),
            Status = table.Column<string>(type: "text", nullable: false),
            RelatedInquiryId = table.Column<int>(type: "integer", nullable: true),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_EmailLogs", x => x.Id);
            table.ForeignKey(
                      name: "FK_EmailLogs_Inquiries_RelatedInquiryId",
                      column: x => x.RelatedInquiryId,
                      principalTable: "Inquiries",
                      principalColumn: "Id");
          });

      migrationBuilder.CreateTable(
          name: "Attachments",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            PostId = table.Column<int>(type: "integer", nullable: false),
            OriginalName = table.Column<string>(type: "text", nullable: false),
            StoredPath = table.Column<string>(type: "text", nullable: false),
            MimeType = table.Column<string>(type: "text", nullable: false),
            SizeBytes = table.Column<long>(type: "bigint", nullable: false),
            UploadedById = table.Column<string>(type: "text", nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Attachments", x => x.Id);
            table.ForeignKey(
                      name: "FK_Attachments_AspNetUsers_UploadedById",
                      column: x => x.UploadedById,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Restrict);
            table.ForeignKey(
                      name: "FK_Attachments_Posts_PostId",
                      column: x => x.PostId,
                      principalTable: "Posts",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateTable(
          name: "Comments",
          columns: table => new
          {
            Id = table.Column<int>(type: "integer", nullable: false)
                  .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            PostId = table.Column<int>(type: "integer", nullable: false),
            AuthorId = table.Column<string>(type: "text", nullable: false),
            ParentCommentId = table.Column<int>(type: "integer", nullable: true),
            Body = table.Column<string>(type: "text", nullable: false),
            IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
          },
          constraints: table =>
          {
            table.PrimaryKey("PK_Comments", x => x.Id);
            table.ForeignKey(
                      name: "FK_Comments_AspNetUsers_AuthorId",
                      column: x => x.AuthorId,
                      principalTable: "AspNetUsers",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Restrict);
            table.ForeignKey(
                      name: "FK_Comments_Comments_ParentCommentId",
                      column: x => x.ParentCommentId,
                      principalTable: "Comments",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Restrict);
            table.ForeignKey(
                      name: "FK_Comments_Posts_PostId",
                      column: x => x.PostId,
                      principalTable: "Posts",
                      principalColumn: "Id",
                      onDelete: ReferentialAction.Cascade);
          });

      migrationBuilder.CreateIndex(
          name: "IX_AspNetRoleClaims_RoleId",
          table: "AspNetRoleClaims",
          column: "RoleId");

      migrationBuilder.CreateIndex(
          name: "RoleNameIndex",
          table: "AspNetRoles",
          column: "NormalizedName",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_AspNetUserClaims_UserId",
          table: "AspNetUserClaims",
          column: "UserId");

      migrationBuilder.CreateIndex(
          name: "IX_AspNetUserLogins_UserId",
          table: "AspNetUserLogins",
          column: "UserId");

      migrationBuilder.CreateIndex(
          name: "IX_AspNetUserRoles_RoleId",
          table: "AspNetUserRoles",
          column: "RoleId");

      migrationBuilder.CreateIndex(
          name: "EmailIndex",
          table: "AspNetUsers",
          column: "NormalizedEmail");

      migrationBuilder.CreateIndex(
          name: "UserNameIndex",
          table: "AspNetUsers",
          column: "NormalizedUserName",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Attachments_PostId",
          table: "Attachments",
          column: "PostId");

      migrationBuilder.CreateIndex(
          name: "IX_Attachments_UploadedById",
          table: "Attachments",
          column: "UploadedById");

      migrationBuilder.CreateIndex(
          name: "IX_Categories_Slug",
          table: "Categories",
          column: "Slug",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_Comments_AuthorId",
          table: "Comments",
          column: "AuthorId");

      migrationBuilder.CreateIndex(
          name: "IX_Comments_ParentCommentId",
          table: "Comments",
          column: "ParentCommentId");

      migrationBuilder.CreateIndex(
          name: "IX_Comments_PostId",
          table: "Comments",
          column: "PostId");

      migrationBuilder.CreateIndex(
          name: "IX_EmailLogs_RelatedInquiryId",
          table: "EmailLogs",
          column: "RelatedInquiryId");

      migrationBuilder.CreateIndex(
          name: "IX_Inquiries_AssignedAdminId",
          table: "Inquiries",
          column: "AssignedAdminId");

      migrationBuilder.CreateIndex(
          name: "IX_PageContents_Key",
          table: "PageContents",
          column: "Key",
          unique: true);

      migrationBuilder.CreateIndex(
          name: "IX_PageContents_UpdatedById",
          table: "PageContents",
          column: "UpdatedById");

      migrationBuilder.CreateIndex(
          name: "IX_Posts_AuthorId",
          table: "Posts",
          column: "AuthorId");

      migrationBuilder.CreateIndex(
          name: "IX_Posts_CategoryId",
          table: "Posts",
          column: "CategoryId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
          name: "AspNetRoleClaims");

      migrationBuilder.DropTable(
          name: "AspNetUserClaims");

      migrationBuilder.DropTable(
          name: "AspNetUserLogins");

      migrationBuilder.DropTable(
          name: "AspNetUserRoles");

      migrationBuilder.DropTable(
          name: "AspNetUserTokens");

      migrationBuilder.DropTable(
          name: "Attachments");

      migrationBuilder.DropTable(
          name: "Comments");

      migrationBuilder.DropTable(
          name: "EmailLogs");

      migrationBuilder.DropTable(
          name: "PageContents");

      migrationBuilder.DropTable(
          name: "AspNetRoles");

      migrationBuilder.DropTable(
          name: "Posts");

      migrationBuilder.DropTable(
          name: "Inquiries");

      migrationBuilder.DropTable(
          name: "Categories");

      migrationBuilder.DropTable(
          name: "AspNetUsers");
    }
  }
}
