using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.DTOs;
using ComucAPI.Models;

namespace ComucAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProfessorsController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public ProfessorsController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Professors
        [HttpGet]
        public async Task<ActionResult> GetProfessores()
        {
            var professores = await _context.Professores
                .Select(p => new
                {
                    IdProfessor = p.IdProfessor,
                    Nome = p.Nome,
                    CPF = p.CPF,
                    RG = p.RG,
                    Telefone = p.Telefone,
                    DataNascimento = p.DataNascimento,
                    Endereco = p.Endereco,
                })
                .ToListAsync();

            return Ok(professores);
        }

        // GET: api/Professors/5
        [HttpGet("{id}")]
        public async Task<ActionResult> GetProfessor(int id)
        {
            var professor = await _context.Professores
                .Where(p => p.IdProfessor == id)
                .Select(p => new { IdProfessor = p.IdProfessor, Nome = p.Nome, CPF = p.CPF, RG = p.RG, Telefone = p.Telefone, DataNascimento = p.DataNascimento, Endereco = p.Endereco })
                .FirstOrDefaultAsync();

            if (professor == null)
                return NotFound();

            return Ok(professor);
        }

        // POST: api/Professors
        [HttpPost]
        public async Task<ActionResult> PostProfessor([FromBody] ProfessorCreateDTO dto)
        {
            var professor = new Professor
            {
                Nome = dto.Nome.ToLower(),
                Senha = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
                CPF = dto.CPF,
                RG = dto.RG,
                Telefone = dto.Telefone,
                DataNascimento = dto.DataNascimento,
                Endereco = dto.Endereco,
            };

            _context.Professores.Add(professor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProfessor), new { id = professor.IdProfessor },
                new { professor.IdProfessor, professor.Nome });
        }

        // PUT: api/Professors/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProfessor(int id, [FromBody] ProfessorEditDTO dto)
        {
            var professor = await _context.Professores.FindAsync(id);

            if (professor == null)
                return NotFound();

            professor.Nome = dto.Nome.ToLower();
            professor.CPF = dto.CPF;
            professor.RG = dto.RG;
            professor.Telefone = dto.Telefone;
            professor.DataNascimento = dto.DataNascimento;
            professor.Endereco = dto.Endereco;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Professors/5/senha
        [HttpPut("{id}/senha")]
        public async Task<IActionResult> AlterarSenha(int id, [FromBody] AlterarSenhaDTO dto)
        {
            var professor = await _context.Professores.FindAsync(id);

            if (professor == null)
                return NotFound();

            if (BCrypt.Net.BCrypt.Verify(dto.NovaSenha, professor.Senha))
                return BadRequest(new { Mensagem = "A nova senha não pode ser igual à senha atual." });

            professor.Senha = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Professors/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProfessor(int id)
        {
            var professor = await _context.Professores.FindAsync(id);

            if (professor == null)
                return NotFound();

            if (professor.Nome == "admin")
                return BadRequest(new { Mensagem = "O usuário admin não pode ser excluído." });

            _context.Professores.Remove(professor);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
