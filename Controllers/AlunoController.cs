using ComucAPI.Data;
using ComucAPI.DTOs;
using ComucAPI.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ComucAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AlunoController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public AlunoController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Aluno
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Aluno>>> GetAlunos()
        {
            return await _context.Alunos.ToListAsync();
        }

        // GET: api/Aluno/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Aluno>> GetAluno(int id)
        {
            var aluno = await _context.Alunos.FindAsync(id);

            if (aluno == null)
            {
                return NotFound();
            }

            return aluno;
        }

        // PUT: api/Aluno/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAluno(int id, Aluno aluno)
        {
            if (id != aluno.IdAluno)
            {
                return BadRequest();
            }

            _context.Entry(aluno).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AlunoExists(id))
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

        // POST: api/Aluno
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Aluno>> PostAluno([FromBody] AlunoCreateDTO dto)
        {
            // 1. Busca no banco de dados todas as bandas cujos IDs foram enviados no DTO
            var bandasSelecionadas = await _context.Bandas
                .Where(b => dto.IdBandas.Contains(b.IdBanda))
                .ToListAsync();

            // 2. Cria o objeto Aluno mapeando todas as propriedades do modelo
            var aluno = new Aluno
            {
                Nome = dto.Nome,
                DataNascimento = dto.DataNascimento,
                Telefone = dto.Telefone,
                CPF = dto.CPF,
                Endereco = dto.Endereco,
                NomePai = dto.NomePai,
                NomeMae = dto.NomeMae,
                Bolsista = dto.Bolsista,
                DataInicio = dto.DataInicio,
                MotivoSaida = dto.MotivoSaida,
                PossuiInstrumento = dto.PossuiInstrumento,
                TamanhoVestimenta = dto.TamanhoVestimenta,

                // O Entity Framework Core associa automaticamente na tabela intermediária
                Bandas = bandasSelecionadas
            };


            // 3. Salva o aluno e os seus vínculos no banco de dados
            _context.Alunos.Add(aluno);
            await _context.SaveChangesAsync();

            // Nota: Como o seu model mapeou a PK na propriedade 'IdBanda', usamos ela aqui
            return CreatedAtAction("GetAluno", new { id = aluno.IdAluno }, aluno);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAluno(int id)
        {
            var aluno = await _context.Alunos.FindAsync(id);
            if (aluno == null)
            {
                return NotFound();
            }

            _context.Alunos.Remove(aluno);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AlunoExists(int id)
        {
            return _context.Alunos.Any(e => e.IdAluno == id);
        }
    }
}
