using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.Models;
using ComucAPI.DTOs;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

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
        [HttpGet("relatorio")]
        public async Task<ActionResult> GetRelatorioChamada()
        {
            var listagem = await _context.Presencas
                .Include(p => p.Aluno)
                .Include(p => p.Professor)
                .Include(p => p.Banda)
                .Select(p => new
                {
                    IdPresenca = p.IdPresenca,
                    Data = p.Data,
                    Presente = p.Presente,
                    TipoEvento = p.Nome,
                    NomeAluno = p.Aluno != null ? p.Aluno.Nome : "Desconhecido",
                    NomeProfessor = p.Professor != null ? p.Professor.Nome : "Desconhecido",
                    NomeBanda = p.Banda != null ? p.Banda.Nome : "Ensaio Geral / Sem Turma"
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

            // CORREÇÃO DE PERFORMANCE: Buscar todos os alunos de uma vez (Evita N+1 Queries)
            var idsAlunos = lote.Alunos.Select(a => a.IdAluno).ToList();
            var alunosNoBanco = await _context.Alunos
                .Where(a => idsAlunos.Contains(a.IdAluno))
                .ToListAsync();

            var novasPresencas = new List<Presenca>();

            // 3. Percorre a lista de alunos (agora em memória) vinculando tudo
            foreach (var item in lote.Alunos)
            {
                var aluno = alunosNoBanco.FirstOrDefault(a => a.IdAluno == item.IdAluno);

                if (aluno != null)
                {
                    novasPresencas.Add(new Presenca
                    {
                        Data = lote.Data,
                        Presente = item.Presente,
                        Professor = professor,
                        Aluno = aluno,
                        Banda = banda,
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

        // GET: api/Presencas/relatorio-faltas
        // Unificado: Retorna o total de faltas e o detalhamento das datas.
        // Aceita filtros combinados de Aluno, Banda, Ano e Mês.
        [HttpGet("relatorio-faltas")]
        public async Task<ActionResult> GetFaltasCompleto(
            [FromQuery] int? idAluno,
            [FromQuery] int? idBanda,
            [FromQuery] int? ano,
            [FromQuery] int? mes)
        {
            // Se o ano não for passado, assume o ano atual
            int anoFiltro = ano ?? DateTime.Now.Year;

            // 1. Monta a consulta inicial (apenas faltas e alunos válidos no ano selecionado)
            var query = _context.Presencas
                .Include(p => p.Aluno)
                .Include(p => p.Banda)
                .Where(p => p.Presente == false && p.Aluno != null && p.Data.Year == anoFiltro)
                .AsQueryable();

            // 2. Filtro por Mês
            if (mes.HasValue)
            {
                query = query.Where(p => p.Data.Month == mes.Value);
            }

            // 3. Filtro por Aluno
            if (idAluno.HasValue)
            {
                query = query.Where(p => p.Aluno.IdAluno == idAluno.Value);
            }

            // 4. Filtro por Banda (Hierárquico: Banda atual + Sub-turmas)
            if (idBanda.HasValue)
            {
                var idsBandasFiltrar = await _context.Bandas
                    .Where(b => b.IdBanda == idBanda.Value || b.banda_pai_id == idBanda.Value)
                    .Select(b => b.IdBanda)
                    .ToListAsync();

                query = query.Where(p => p.Banda != null && idsBandasFiltrar.Contains(p.Banda.IdBanda));
            }

            // Vai ao banco e traz os dados brutos filtrados
            var faltas = await query.ToListAsync();

            // 5. Tratamento de Aluno Específico sem Faltas (Retorna zero em vez de lista vazia)
            if (idAluno.HasValue && !faltas.Any())
            {
                var aluno = await _context.Alunos.FindAsync(idAluno.Value);
                if (aluno == null) return NotFound(new { Mensagem = "Aluno não encontrado." });

                return Ok(new List<object>
                {
                    new
                    {
                        IdAluno = aluno.IdAluno,
                        NomeAluno = aluno.Nome,
                        Ano = anoFiltro,
                        TotalFaltasGeral = 0,
                        DetalhesPorTurma = new List<object>() // Array vazio de detalhes
                    }
                });
            }

            // 6. Agrupamento Unificado: Total Geral + Detalhamento
            var relatorio = faltas
                .GroupBy(p => new { p.Aluno.IdAluno, p.Aluno.Nome })
                .Select(grupoAluno => new
                {
                    IdAluno = grupoAluno.Key.IdAluno,
                    NomeAluno = grupoAluno.Key.Nome,
                    Ano = anoFiltro,

                    // O total geral que você queria:
                    TotalFaltasGeral = grupoAluno.Count(),

                    // O detalhamento histórico:
                    DetalhesPorTurma = grupoAluno
                        .GroupBy(p => p.Banda != null ? p.Banda.Nome : "Geral / Sem Turma")
                        .Select(grupoTurma => new
                        {
                            Turma = grupoTurma.Key,
                            TotalFaltasNaTurma = grupoTurma.Count(),
                            DatasDasFaltas = grupoTurma.Select(p => p.Data.ToString("dd/MM/yyyy")).ToList()
                        })
                        .OrderBy(t => t.Turma)
                        .ToList()
                })
                .OrderBy(r => r.NomeAluno)
                .ToList();

            return Ok(relatorio);
        }
    }
}