using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.Models;
using ComucAPI.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ComucAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PresencasController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public PresencasController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Presencas/relatorio
        // Retorna o relatório completo sabendo a turma, o aluno e o professor
        [HttpGet("relatorio")]
        public async Task<ActionResult> GetRelatorioChamada()
        {
            var listagem = await _context.Presencas
                .Include(p => p.Aluno)
                .Include(p => p.Professor)
                .Include(p => p.Banda) // Inclui a banda na consulta
                .Select(p => new
                {
                    IdPresenca = p.IdPresenca,
                    Data = p.Data,
                    Presente = p.Presente,
                    TipoEvento = p.Nome, // Nome da chamada (Ex: Ensaio, Aula)
                    NomeAluno = p.Aluno != null ? p.Aluno.Nome : "Desconhecido",
                    NomeProfessor = p.Professor != null ? p.Professor.Nome : "Desconhecido",
                    NomeBanda = p.Banda != null ? p.Banda.Nome : "Ensaio Geral / Sem Turma" // Exibe o nome da banda
                })
                .ToListAsync();

            return Ok(listagem);
        }

        // POST: api/Presencas/registrar-lote
        [HttpPost("registrar-lote")]
        public async Task<IActionResult> RegistrarChamadaEmLote([FromBody] LoteChamadaRequest lote)
        {
            // 1. Valida se o professor existe
            var professor = await _context.Professores.FindAsync(lote.IdProfessor);
            if (professor == null)
            {
                return NotFound(new { Mensagem = "Professor não encontrado." });
            }

            // 2. Busca a banda/turma se ela tiver sido informada
            Banda banda = null;
            if (lote.IdBanda.HasValue)
            {
                banda = await _context.Bandas.FindAsync(lote.IdBanda.Value);
                if (banda == null)
                {
                    return NotFound(new { Mensagem = "Banda/Turma não encontrada." });
                }
            }

            var novasPresencas = new List<Presenca>();

            // 3. Percorre a lista de alunos vinculando tudo
            foreach (var item in lote.Alunos)
            {
                var aluno = await _context.Alunos.FindAsync(item.IdAluno);

                if (aluno != null)
                {
                    novasPresencas.Add(new Presenca
                    {
                        Data = lote.Data,
                        Presente = item.Presente,
                        Professor = professor,
                        Aluno = aluno,
                        Banda = banda, // <-- VINCULA A BANDA AQUI
                        Nome = lote.NomeChamada
                    });
                }
            }

            _context.Presencas.AddRange(novasPresencas);
            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = $"Chamada de '{lote.NomeChamada}' salva com sucesso para a turma!" });
        }

        // PUT: api/Presencas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPresenca(int id, [FromBody] PresencaEditDTO dto)
        {
            var presencaNoBanco = await _context.Presencas.FindAsync(id);
            if (presencaNoBanco == null)
            {
                return NotFound(new { Mensagem = "Registro de presença não encontrado." });
            }

            presencaNoBanco.Presente = dto.Presente;
            presencaNoBanco.Nome = dto.Nome;
            presencaNoBanco.Data = dto.Data;

            _context.Entry(presencaNoBanco).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = "Presença atualizada com sucesso!" });
        }

        // DELETE: api/Presencas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePresenca(int id)
        {
            var presenca = await _context.Presencas.FindAsync(id);
            if (presenca == null) return NotFound();

            _context.Presencas.Remove(presenca);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}