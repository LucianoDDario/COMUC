using BCrypt.Net;
using ComucAPI.Data;
using ComucAPI.DTOs;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace ComucAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public AuthController(ComucDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] DTOs.LoginRequest request)
        {
            // 1. Tenta autenticar como Professor usando o Nome
            var professor = await _context.Professores
                .FirstOrDefaultAsync(p => p.Nome == request.Nome);

            if (professor != null)
            {
                // Verifica o hash da senha
                bool senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, professor.Senha);
                if (senhaValida)
                {
                    return Ok(new
                    {
                        Mensagem = "Login realizado com sucesso",
                        TipoUsuario = "Professor",
                        Id = professor.IdProfessor,
                        Nome = professor.Nome
                    });
                }
            }

            // 2. Tenta autenticar como Funcionário usando o nome
            var funcionario = await _context.Funcionarios
                .FirstOrDefaultAsync(f => f.nome == request.Nome);

            if (funcionario != null)
            {
                // Verifica o hash da senha (notando que a propriedade está minúscula no model)
                bool senhaValida = BCrypt.Net.BCrypt.Verify(request.Senha, funcionario.senha);
                if (senhaValida)
                {
                    return Ok(new
                    {
                        Mensagem = "Login realizado com sucesso",
                        TipoUsuario = "Funcionario",
                        Id = funcionario.IdFuncionario,
                        Nome = funcionario.nome
                    });
                }
            }

            // 3. Se não encontrou ou a senha está errada
            return Unauthorized(new { Mensagem = "Usuário ou senha inválidos." });
        }
    }
}