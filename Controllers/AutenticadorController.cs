using BCrypt.Net;
using ComucAPI.Data;
using ComucAPI.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ComucAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ComucDbContext _context;
        private readonly string _jwtSecret;

        public AuthController(ComucDbContext context, IConfiguration configuration)
        {
            _context = context;
            _jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")!;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var nomeLower = request.Nome.ToLower();

            // 1. Tenta autenticar como Professor
            var professor = await _context.Professores
                .FirstOrDefaultAsync(p => p.Nome == nomeLower);

            if (professor != null && BCrypt.Net.BCrypt.Verify(request.Senha, professor.Senha))
            {
                var token = GerarToken(professor.IdProfessor, professor.Nome, "Professor");
                return Ok(new
                {
                    Token = token,
                    Id = professor.IdProfessor,
                    Nome = professor.Nome,
                    TipoUsuario = "Professor",
                });
            }

            // 2. Tenta autenticar como Funcionário
            var funcionario = await _context.Funcionarios
                .FirstOrDefaultAsync(f => f.nome == nomeLower);

            if (funcionario != null && BCrypt.Net.BCrypt.Verify(request.Senha, funcionario.senha))
            {
                var token = GerarToken(funcionario.IdFuncionario, funcionario.nome, "Funcionario");
                return Ok(new
                {
                    Token = token,
                    Id = funcionario.IdFuncionario,
                    Nome = funcionario.nome,
                    TipoUsuario = "Funcionario",
                });
            }

            return Unauthorized(new { Mensagem = "Usuário ou senha inválidos." });
        }

        private string GerarToken(int id, string nome, string tipoUsuario)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, id.ToString()),
                new Claim(ClaimTypes.Name, nome),
                new Claim(ClaimTypes.Role, tipoUsuario),
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
