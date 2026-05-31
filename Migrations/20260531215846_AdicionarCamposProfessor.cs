using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComucAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCamposProfessor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cpf",
                table: "professor",
                type: "character varying(11)",
                maxLength: 11,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "endereco",
                table: "professor",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "telefone",
                table: "professor",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "cpf",
                table: "professor");

            migrationBuilder.DropColumn(
                name: "endereco",
                table: "professor");

            migrationBuilder.DropColumn(
                name: "telefone",
                table: "professor");
        }
    }
}
