using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ComucAPI.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarRGDataNascimentoProfessor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "data_nascimento",
                table: "professor",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rg",
                table: "professor",
                type: "character varying(9)",
                maxLength: 9,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "data_nascimento",
                table: "professor");

            migrationBuilder.DropColumn(
                name: "rg",
                table: "professor");
        }
    }
}
