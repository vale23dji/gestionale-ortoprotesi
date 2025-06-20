using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrtoProtesiApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivacyAndGdprTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DataDeletionRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UtenteId = table.Column<int>(type: "int", nullable: false),
                    Motivazione = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataRichiesta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DataCompletamento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StatoRichiesta = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NoteAmministrative = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataDeletionRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DataDeletionRequests_Utenti_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PrivacyConsents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UtenteId = table.Column<int>(type: "int", nullable: false),
                    Privacy = table.Column<bool>(type: "bit", nullable: false),
                    Marketing = table.Column<bool>(type: "bit", nullable: false),
                    Cookie = table.Column<bool>(type: "bit", nullable: false),
                    Termini = table.Column<bool>(type: "bit", nullable: false),
                    Gdpr = table.Column<bool>(type: "bit", nullable: false),
                    DataAccettazione = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VersionePolicy = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    IPAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivacyConsents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrivacyConsents_Utenti_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataDeletionRequests_UtenteId",
                table: "DataDeletionRequests",
                column: "UtenteId");

            migrationBuilder.CreateIndex(
                name: "IX_PrivacyConsents_UtenteId",
                table: "PrivacyConsents",
                column: "UtenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataDeletionRequests");

            migrationBuilder.DropTable(
                name: "PrivacyConsents");
        }
    }
}
