using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.Models;
using ComucAPI.DTOs;

namespace ComucAPI.Controllers
{
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
        public async Task<ActionResult<IEnumerable<Banda>>> GetBandas()
        {
            return await _context.Bandas.ToListAsync();
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

            // 4. Retorna sucesso confirmando os dados criados
            return CreatedAtAction("GetBanda", new { id = banda.IdBanda }, new
            {
                IdBanda = banda.IdBanda,
                Nome = banda.Nome,
                IdProfessor = banda.id_professor
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

        private bool BandaExists(int id)
        {
            return _context.Bandas.Any(e => e.IdBanda == id);
        }

        [HttpGet("{id}/alunos")]
        public async Task<ActionResult> GetAlunosDaBanda(int id)
        {
            // Busca a banda e já inclui a lista de alunos conectada a ela
            var banda = await _context.Bandas
                .Include(b => b.Alunos)
                .FirstOrDefaultAsync(b => b.IdBanda == id);

            if (banda == null)
            {
                return NotFound(new { Mensagem = "Banda não encontrada." });
            }

            // Retorna apenas os dados que a tela precisa para montar a lista
            var alunosParaChamada = banda.Alunos.Select(a => new
            {
                IdAluno = a.IdAluno, // Usando a propriedade IdBanda que atua como PK do seu model Aluno
                Nome = a.Nome
            }).ToList();

            return Ok(alunosParaChamada);
        }
    }

}
