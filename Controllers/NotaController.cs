using ComucAPI.Data;
using ComucAPI.DTOs;
using ComucAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ComucAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NotaController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public NotaController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Nota
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Nota>>> GetNotas()
        {
            return await _context.Notas.ToListAsync();
        }

        // GET: api/Nota/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Nota>> GetNota(int id)
        {
            var nota = await _context.Notas.FindAsync(id);

            if (nota == null)
            {
                return NotFound();
            }

            return nota;
        }

        // PUT: api/Nota/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutNota(int id, [FromBody] NotaEditDTO dto)
        {
            // 1. Busca a nota original no banco de dados
            var notaNoBanco = await _context.Notas.FindAsync(id);

            if (notaNoBanco == null)
            {
                return NotFound(new { Mensagem = "Registro de nota não encontrado." });
            }

            // 2. Atualiza os campos com os novos valores enviados pelo front-end
            notaNoBanco.ValorNota = dto.ValorNota;
            notaNoBanco.Mes = dto.Mes;
            notaNoBanco.Musica = dto.Musica;
            notaNoBanco.Descricao = dto.Descricao;

            // 3. Define o estado como modificado para o EF gerar o comando UPDATE
            _context.Entry(notaNoBanco).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Notas.Any(e => e.IdNota == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { Mensagem = "Nota atualizada com sucesso!" });
        }

        // POST: api/Nota
        [HttpPost]
        public async Task<ActionResult> PostNota([FromBody] NotaCreateDTO dto)
        {
            // 1. Valida se o aluno e o professor existem
            var aluno = await _context.Alunos.FindAsync(dto.IdAluno);
            var professor = await _context.Professores.FindAsync(dto.IdProfessor);

            if (aluno == null || professor == null)
            {
                return NotFound(new { Mensagem = "Aluno ou Professor não encontrado." });
            }

            // 2. Cria o objeto Nota mapeando os relacionamentos virtuais
            var novaNota = new Nota
            {
                ValorNota = dto.ValorNota,
                Mes = dto.Mes,
                Musica = dto.Musica,
                Descricao = dto.Descricao,
                Aluno = aluno,
                Professor = professor
            };

            _context.Notas.Add(novaNota);
            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = "Nota lançada com sucesso!" });
        }

        // POST: api/Nota/lancamento-lote
        [Authorize(Roles = "Professor")]
        [HttpPost("lancamento-lote")]
        public async Task<ActionResult> LancamentoLote([FromBody] NotaLancamentoDTO dto)
        {
            if (dto.Alunos == null || dto.Alunos.Count == 0)
                return BadRequest(new { Mensagem = "Nenhum aluno informado." });

            if (dto.Alunos.Any(a => string.IsNullOrWhiteSpace(a.Musica)))
                return BadRequest(new { Mensagem = "A música/peça avaliada é obrigatória para todos os alunos." });

            if (dto.Alunos.Any(a => a.ValorNota < 0 || a.ValorNota > 10))
                return BadRequest(new { Mensagem = "As notas devem estar entre 0 e 10." });

            // 1. Identifica o professor pelo token JWT
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (idClaim == null)
                return Unauthorized(new { Mensagem = "Professor não identificado." });

            int professorId = int.Parse(idClaim);
            var professor = await _context.Professores.FindAsync(professorId);
            if (professor == null)
                return NotFound(new { Mensagem = "Professor não encontrado." });

            // 2. Normaliza mês/ano para o primeiro dia do mês
            var mesAno = new DateTime(dto.Mes.Year, dto.Mes.Month, 1);
            var idAlunos = dto.Alunos.Select(a => a.IdAluno).ToList();

            // 3. Busca notas já existentes deste professor para estes alunos neste período
            var notasExistentes = await _context.Notas
                .Include(n => n.Aluno)
                .Where(n =>
                    idAlunos.Contains(n.Aluno.IdAluno) &&
                    n.Professor.IdProfessor == professorId &&
                    n.Mes.Year == mesAno.Year &&
                    n.Mes.Month == mesAno.Month)
                .ToListAsync();

            // 4. Busca apenas alunos bolsistas
            var alunosBolsistas = await _context.Alunos
                .Where(a => idAlunos.Contains(a.IdAluno) && a.Bolsista == true)
                .ToListAsync();

            if (alunosBolsistas.Count != dto.Alunos.Count)
                return BadRequest(new { Mensagem = "Um ou mais alunos não encontrados ou não são bolsistas." });

            // 5. Upsert: cria se não existe, atualiza se já existe
            foreach (var item in dto.Alunos)
            {
                var notaExistente = notasExistentes.FirstOrDefault(n => n.Aluno.IdAluno == item.IdAluno);

                if (notaExistente != null)
                {
                    notaExistente.ValorNota = item.ValorNota;
                    notaExistente.Musica = item.Musica.Trim();
                    notaExistente.Descricao = item.Descricao?.Trim() ?? "";
                }
                else
                {
                    var aluno = alunosBolsistas.First(a => a.IdAluno == item.IdAluno);
                    _context.Notas.Add(new Nota
                    {
                        ValorNota = item.ValorNota,
                        Mes = mesAno,
                        Musica = item.Musica.Trim(),
                        Descricao = item.Descricao?.Trim() ?? "",
                        Aluno = aluno,
                        Professor = professor
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { Mensagem = "Notas registradas com sucesso." });
        }

        // GET: api/Nota/medias
        // Se passar ?mes=5&ano=2026 ele filtra. Se não passar nada, traz tudo!
        [HttpGet("medias")]
        public async Task<ActionResult> GetMedias([FromQuery] int? mes, [FromQuery] int? ano)
        {
            // 1. Criamos a consulta básica filtrando apenas alunos bolsistas
            var query = _context.Notas
                .Include(n => n.Aluno)
                .Include(n => n.Professor)
                .Where(n => n.Aluno.Bolsista == true)
                .AsQueryable();

            // 2. Se o front-end passou o mês, adiciona o filtro na consulta SQL
            if (mes.HasValue)
            {
                query = query.Where(n => n.Mes.Month == mes.Value);
            }

            // 3. Se o front-end passou o ano, adiciona o filtro na consulta SQL
            if (ano.HasValue)
            {
                query = query.Where(n => n.Mes.Year == ano.Value);
            }

            // 4. Só agora o Entity Framework vai ao banco e busca apenas o que passou no filtro
            var notasFiltradas = await query.ToListAsync();

            // 5. Agrupa os resultados filtrados para calcular a média
            var relatorioMedias = notasFiltradas
                .GroupBy(n => new { n.Aluno.IdAluno, n.Aluno.Nome, n.Mes.Month, n.Mes.Year, n.Musica })
                .Select(grupo => new
                {
                    IdAluno = grupo.Key.IdAluno,
                    NomeAluno = grupo.Key.Nome,
                    MesAno = $"{grupo.Key.Month:D2}/{grupo.Key.Year}",
                    Musica = grupo.Key.Musica,
                    DetalhesNotas = grupo.Select(n => new
                    {
                        IdNota = n.IdNota,
                        Professor = n.Professor.Nome,
                        Nota = n.ValorNota,
                        Descricao = n.Descricao
                    }).ToList(),
                    Media = grupo.Average(n => n.ValorNota)
                })
                .ToList();

            return Ok(relatorioMedias);
        }

        // DELETE: api/Nota/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNota(int id)
        {
            var nota = await _context.Notas.FindAsync(id);
            if (nota == null)
            {
                return NotFound();
            }

            _context.Notas.Remove(nota);
            await _context.SaveChangesAsync();

            return NoContent();
        }

    }
}