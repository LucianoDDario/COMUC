using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.Models;
using ComucAPI.DTOs;

namespace ComucAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BandaController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public BandaController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Banda
        [HttpGet]
        public async Task<ActionResult> GetBandas()
        {
            var bandas = await _context.Bandas
                .Include(b => b.Alunos)
                .Include(b => b.Professor)
                .Select(b => new
                {
                    IdBanda = b.IdBanda,
                    Nome = b.Nome,
                    IdProfessor = b.id_professor,
                    NomeProfessor = b.Professor != null ? b.Professor.Nome : "Sem professor",
                    TotalAlunos = b.Alunos.Count
                })
                .ToListAsync();

            return Ok(bandas);
        }

        // GET: api/Banda/hierarquia
        [HttpGet("hierarquia")]
        public async Task<ActionResult> GetBandasHierarquia()
        {
            var bandasRaw = await _context.Bandas
                .Where(b => b.banda_pai_id == null)
                .Include(b => b.SubTurmas).ThenInclude(s => s.Alunos)
                .Include(b => b.Alunos)
                .Include(b => b.Professor)
                .ToListAsync();

            var result = bandasRaw.Select(b => new
            {
                IdBanda = b.IdBanda,
                Nome = b.Nome,
                IdProfessor = b.id_professor,
                NomeProfessor = b.Professor?.Nome ?? "Sem professor",
                TotalAlunos = b.Alunos.Count + (b.SubTurmas ?? new List<Banda>()).Sum(s => s.Alunos.Count),
                SubTurmas = (b.SubTurmas ?? new List<Banda>()).Select(s => new
                {
                    s.IdBanda,
                    s.Nome,
                    TotalAlunos = s.Alunos.Count
                }).ToList()
            });

            return Ok(result);
        }

        // GET: api/Banda/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Banda>> GetBanda(int id)
        {
            var banda = await _context.Bandas.FindAsync(id);

            if (banda == null)
            {
                return NotFound();
            }

            return banda;
        }

        // PUT: api/Banda/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBanda(int id, Banda banda)
        {
            if (id != banda.IdBanda)
            {
                return BadRequest();
            }

            _context.Entry(banda).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BandaExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Banda
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        // POST: api/Banda
        [HttpPost]
        public async Task<ActionResult> PostBanda([FromBody] BandaCreateDTO dto)
        {
            // 1. Verifica se o professor informado realmente existe
            var professor = await _context.Professores.FindAsync(dto.IdProfessor);

            if (professor == null)
            {
                return NotFound(new { Mensagem = "Não é possível criar a banda: Professor não encontrado." });
            }

            // 2. Cria o objeto Banda mapeando os dados do DTO
            var banda = new Banda
            {
                Nome = dto.Nome,
                id_professor = dto.IdProfessor
            };

            // 3. Salva no banco de dados
            _context.Bandas.Add(banda);
            await _context.SaveChangesAsync();

            // 4. Se solicitado, cria sub-turmas Manhã e Tarde
            if (dto.TemTurnos)
            {
                _context.Bandas.AddRange(
                    new Banda { Nome = "Manhã", id_professor = dto.IdProfessor, banda_pai_id = banda.IdBanda },
                    new Banda { Nome = "Tarde", id_professor = dto.IdProfessor, banda_pai_id = banda.IdBanda }
                );
                await _context.SaveChangesAsync();
            }

            // 5. Retorna sucesso confirmando os dados criados
            return CreatedAtAction("GetBanda", new { id = banda.IdBanda }, new
            {
                IdBanda = banda.IdBanda,
                Nome = banda.Nome,
                IdProfessor = banda.id_professor,
                TemTurnos = dto.TemTurnos
            });
        }

        // DELETE: api/Banda/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBanda(int id)
        {
            var banda = await _context.Bandas.FindAsync(id);
            if (banda == null)
            {
                return NotFound();
            }

            _context.Bandas.Remove(banda);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Banda/5/vincular-aluno
        [HttpPost("{id}/vincular-aluno")]
        public async Task<IActionResult> VincularAluno(int id, [FromBody] VincularAlunoDTO dto)
        {
            var banda = await _context.Bandas
                .Include(b => b.Alunos)
                .FirstOrDefaultAsync(b => b.IdBanda == id);

            if (banda == null)
                return NotFound(new { Mensagem = "Banda não encontrada." });

            var aluno = await _context.Alunos.FindAsync(dto.IdAluno);

            if (aluno == null)
                return NotFound(new { Mensagem = "Aluno não encontrado." });

            if (banda.Alunos.Any(a => a.IdAluno == dto.IdAluno))
                return Conflict(new { Mensagem = "Aluno já está vinculado a esta banda." });

            banda.Alunos.Add(aluno);
            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = "Aluno vinculado com sucesso." });
        }

        private bool BandaExists(int id)
        {
            return _context.Bandas.Any(e => e.IdBanda == id);
        }

        // GET: api/Banda/5/alunos
        [HttpGet("{id}/alunos")]
        public async Task<ActionResult> GetAlunosDaBanda(int id)
        {
            // 1. Busca a banda selecionada pelo professor
            var banda = await _context.Bandas
                .Include(b => b.Alunos)
                .Include(b => b.SubTurmas) // Carrega as filhas, se houver
                    .ThenInclude(sub => sub.Alunos) // Já traz os alunos das filhas
                .FirstOrDefaultAsync(b => b.IdBanda == id);

            if (banda == null)
            {
                return NotFound(new { Mensagem = "Banda/Turma não encontrada." });
            }

            // 2. Prepara uma lista para guardar todos os alunos
            var todosOsAlunos = new List<Aluno>();

            // 3. Adiciona os alunos que estão diretamente nesta banda (se houver)
            todosOsAlunos.AddRange(banda.Alunos);

            // 4. Se essa banda tiver filhas (Ex: é a Banda Mirim Geral), adiciona os alunos das filhas também
            if (banda.SubTurmas != null && banda.SubTurmas.Any())
            {
                foreach (var subTurma in banda.SubTurmas)
                {
                    todosOsAlunos.AddRange(subTurma.Alunos);
                }
            }

            // 5. Formata para o front-end, remove duplicados e coloca em ordem alfabética
            var alunosParaChamada = todosOsAlunos
                .Select(a => new
                {
                    IdAluno = a.IdAluno, // Garanta que o model está como IdAluno
                    Nome = a.Nome
                })
                .GroupBy(a => a.IdAluno) // Evita que um aluno apareça duas vezes se ele fizer as duas turmas
                .Select(g => g.First())
                .OrderBy(a => a.Nome)
                .ToList();

            return Ok(alunosParaChamada);
        }


    }

}
