using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
    public class FuncionarioController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public FuncionarioController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Funcionario
        [HttpGet]
        public async Task<ActionResult> GetFuncionarios()
        {
            var funcionarios = await _context.Funcionarios
                .Select(f => new { IdFuncionario = f.IdFuncionario, Nome = f.nome })
                .ToListAsync();
            return Ok(funcionarios);
        }

        // GET: api/Funcionario/5
        [HttpGet("{id}")]
        public async Task<ActionResult> GetFuncionario(int id)
        {
            var funcionario = await _context.Funcionarios
                .Where(f => f.IdFuncionario == id)
                .Select(f => new { IdFuncionario = f.IdFuncionario, Nome = f.nome })
                .FirstOrDefaultAsync();

            if (funcionario == null)
                return NotFound();

            return Ok(funcionario);
        }

        // PUT: api/Funcionario/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFuncionario(int id, Funcionario funcionario)
        {
            if (id != funcionario.IdFuncionario)
            {
                return BadRequest();
            }

            _context.Entry(funcionario).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FuncionarioExists(id))
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

        // POST: api/Funcionario
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Funcionario>> PostFuncionario(Funcionario funcionario)
        {
            funcionario.nome = funcionario.nome.ToLower();
            funcionario.senha = BCrypt.Net.BCrypt.HashPassword(funcionario.senha);

            _context.Funcionarios.Add(funcionario);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetFuncionario", new { id = funcionario.IdFuncionario }, funcionario);
        }

        // PUT: api/Funcionario/5/senha
        [HttpPut("{id}/senha")]
        public async Task<IActionResult> AlterarSenha(int id, [FromBody] AlterarSenhaDTO dto)
        {
            var funcionario = await _context.Funcionarios.FindAsync(id);

            if (funcionario == null)
                return NotFound();

            if (BCrypt.Net.BCrypt.Verify(dto.NovaSenha, funcionario.senha))
                return BadRequest(new { Mensagem = "A nova senha não pode ser igual à senha atual." });

            funcionario.senha = BCrypt.Net.BCrypt.HashPassword(dto.NovaSenha);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Funcionario/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFuncionario(int id)
        {
            var funcionario = await _context.Funcionarios.FindAsync(id);
            if (funcionario == null)
            {
                return NotFound();
            }

            _context.Funcionarios.Remove(funcionario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FuncionarioExists(int id)
        {
            return _context.Funcionarios.Any(e => e.IdFuncionario == id);
        }
    }
}
