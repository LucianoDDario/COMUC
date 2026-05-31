using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ComucAPI.Migrations
{
    /// <inheritdoc />
    public partial class CriacaoInicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "aluno",
                columns: table => new
                {
                    id_aluno = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    data_de_nascimento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    telefone = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: false),
                    cpf = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: false),
                    rg = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    endereco = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    nome_do_pai = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    nome_da_mae = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    bolsista = table.Column<bool>(type: "boolean", nullable: false),
                    data_de_inicio = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    motivo_de_saida = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    possui_instrumento_proprio = table.Column<bool>(type: "boolean", nullable: false),
                    tamanho_da_vestimenta = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_aluno", x => x.id_aluno);
                });

            migrationBuilder.CreateTable(
                name: "funcionario",
                columns: table => new
                {
                    id_funcionario = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    senha = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_funcionario", x => x.id_funcionario);
                });

            migrationBuilder.CreateTable(
                name: "professor",
                columns: table => new
                {
                    id_professor = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    senha = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_professor", x => x.id_professor);
                });

            migrationBuilder.CreateTable(
                name: "banda",
                columns: table => new
                {
                    id_banda = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "text", nullable: false),
                    id_professor = table.Column<int>(type: "integer", nullable: false),
                    banda_pai_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_banda", x => x.id_banda);
                    table.ForeignKey(
                        name: "FK_banda_banda_banda_pai_id",
                        column: x => x.banda_pai_id,
                        principalTable: "banda",
                        principalColumn: "id_banda");
                    table.ForeignKey(
                        name: "FK_banda_professor_id_professor",
                        column: x => x.id_professor,
                        principalTable: "professor",
                        principalColumn: "id_professor",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "nota",
                columns: table => new
                {
                    id_nota = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    valor_nota = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    mes = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    musica = table.Column<string>(type: "text", nullable: false),
                    descricao = table.Column<string>(type: "text", nullable: false),
                    id_aluno = table.Column<int>(type: "integer", nullable: false),
                    id_professor = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nota", x => x.id_nota);
                    table.ForeignKey(
                        name: "FK_nota_aluno_id_aluno",
                        column: x => x.id_aluno,
                        principalTable: "aluno",
                        principalColumn: "id_aluno",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_nota_professor_id_professor",
                        column: x => x.id_professor,
                        principalTable: "professor",
                        principalColumn: "id_professor",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "banda_aluno",
                columns: table => new
                {
                    id_aluno = table.Column<int>(type: "integer", nullable: false),
                    id_banda = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_banda_aluno", x => new { x.id_aluno, x.id_banda });
                    table.ForeignKey(
                        name: "FK_banda_aluno_aluno_id_aluno",
                        column: x => x.id_aluno,
                        principalTable: "aluno",
                        principalColumn: "id_aluno",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_banda_aluno_banda_id_banda",
                        column: x => x.id_banda,
                        principalTable: "banda",
                        principalColumn: "id_banda",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "presenca",
                columns: table => new
                {
                    id_presenca = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nome = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    data = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    presenca = table.Column<bool>(type: "boolean", nullable: false),
                    id_banda = table.Column<int>(type: "integer", nullable: true),
                    id_aluno = table.Column<int>(type: "integer", nullable: false),
                    id_professor = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_presenca", x => x.id_presenca);
                    table.ForeignKey(
                        name: "FK_presenca_aluno_id_aluno",
                        column: x => x.id_aluno,
                        principalTable: "aluno",
                        principalColumn: "id_aluno",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_presenca_banda_id_banda",
                        column: x => x.id_banda,
                        principalTable: "banda",
                        principalColumn: "id_banda");
                    table.ForeignKey(
                        name: "FK_presenca_professor_id_professor",
                        column: x => x.id_professor,
                        principalTable: "professor",
                        principalColumn: "id_professor",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_banda_banda_pai_id",
                table: "banda",
                column: "banda_pai_id");

            migrationBuilder.CreateIndex(
                name: "IX_banda_id_professor",
                table: "banda",
                column: "id_professor");

            migrationBuilder.CreateIndex(
                name: "IX_banda_aluno_id_banda",
                table: "banda_aluno",
                column: "id_banda");

            migrationBuilder.CreateIndex(
                name: "IX_nota_id_aluno",
                table: "nota",
                column: "id_aluno");

            migrationBuilder.CreateIndex(
                name: "IX_nota_id_professor",
                table: "nota",
                column: "id_professor");

            migrationBuilder.CreateIndex(
                name: "IX_presenca_id_aluno",
                table: "presenca",
                column: "id_aluno");

            migrationBuilder.CreateIndex(
                name: "IX_presenca_id_banda",
                table: "presenca",
                column: "id_banda");

            migrationBuilder.CreateIndex(
                name: "IX_presenca_id_professor",
                table: "presenca",
                column: "id_professor");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "banda_aluno");

            migrationBuilder.DropTable(
                name: "funcionario");

            migrationBuilder.DropTable(
                name: "nota");

            migrationBuilder.DropTable(
                name: "presenca");

            migrationBuilder.DropTable(
                name: "aluno");

            migrationBuilder.DropTable(
                name: "banda");

            migrationBuilder.DropTable(
                name: "professor");
        }
    }
}
