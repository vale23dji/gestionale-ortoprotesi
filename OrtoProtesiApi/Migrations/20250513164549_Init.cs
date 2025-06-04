using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrtoProtesiApi.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailVerifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Expiration = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailVerifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Utenti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cognome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ruolo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmailVerificata = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utenti", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clienti",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UtenteId = table.Column<int>(type: "int", nullable: false),
                    NomeDottore = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CognomeDottore = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TelefonoCellulare = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TelefonoFisso = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CodiceFiscale = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PartitaIva = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NomeStudio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ViaStudio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CittaStudio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CodiceSDI = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clienti", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clienti_Utenti_UtenteId",
                        column: x => x.UtenteId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Lavorazioni",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: true),
                    CreatoDaUtenteId = table.Column<int>(type: "int", nullable: false),
                    NomePaziente = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CognomePaziente = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EtaPaziente = table.Column<int>(type: "int", nullable: true),
                    NumeroTelefonoPaziente = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CodiceFiscalePaziente = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TipiLavorazione = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Stato = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SpecificheTecniche = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataCreazione = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Lavorazioni", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Lavorazioni_Clienti_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clienti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Lavorazioni_Utenti_CreatoDaUtenteId",
                        column: x => x.CreatoDaUtenteId,
                        principalTable: "Utenti",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clienti_UtenteId",
                table: "Clienti",
                column: "UtenteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Lavorazioni_ClienteId",
                table: "Lavorazioni",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_Lavorazioni_CreatoDaUtenteId",
                table: "Lavorazioni",
                column: "CreatoDaUtenteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailVerifications");

            migrationBuilder.DropTable(
                name: "Lavorazioni");

            migrationBuilder.DropTable(
                name: "Clienti");

            migrationBuilder.DropTable(
                name: "Utenti");
        }
    }
}
