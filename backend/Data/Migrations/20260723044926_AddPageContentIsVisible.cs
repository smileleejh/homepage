using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPageContentIsVisible : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "PageContents",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // 기존 편집 영역 백필: 인사말·배너는 노출(true), 공지는 숨김(false 유지).
            // 신규 설치는 DbSeeder가 키별 기본 노출값으로 생성한다.
            migrationBuilder.Sql(
                "UPDATE \"PageContents\" SET \"IsVisible\" = TRUE WHERE \"Key\" IN ('greeting', 'main_banner');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVisible",
                table: "PageContents");
        }
    }
}
