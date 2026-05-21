using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.Models;
using ComucAPI.DTOs; // Garanta que importou a pasta dos DTOs
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
        [HttpGet("relatorio")]
        public async Task<ActionResult<IEnumerable<ChamadaResponseDTO>>> GetRelatorioChamada()
        {
            // O Include traz os dados das tabelas relacionadas (aluno e professor)
            var listagem = await _context.Presencas
                .Include(p => p.Aluno)
                .Include(p => p.Professor)
                .Select(p => new ChamadaResponseDTO
                {
                    IdPresenca = p.IdPresenca,
                    NomeAluno = p.Aluno != null ? p.Aluno.Nome : "Aluno não encontrado",
                    Data = p.Data,
                    Presente = p.Presente,
                    NomeProfessor = p.Professor != null ? p.Professor.Nome : "Professor não encontrado"
                })
                .ToListAsync();

            return Ok(listagem);
        }

        // POST: api/Presencas/registrar
        [HttpPost("registrar")]
        public async Task<ActionResult> RegistrarChamada([FromBody] ChamadaRequestDTO dto)
        {
            // 1. Busca o aluno e o professor no banco para garantir que existem
            // Nota: No seu model Aluno, a chave primária foi mapeada na propriedade 'IdBanda'
            var aluno = await _context.Alunos.FindAsync(dto.IdAluno);
            var professor = await _context.Professores.FindAsync(dto.IdProfessor);

            if (aluno == null)
            {
                return NotFound(new { Mensagem = "Aluno não encontrado." });
            }

            if (professor == null)
            {
                return NotFound(new { Mensagem = "Professor não encontrado." });
            }

            // 2. Cria o objeto de Presença mapeando os relacionamentos reais
            var novaPresenca = new Presenca
            {
                Data = dto.Data,
                Presente = dto.Presente,
                Aluno = aluno,
                Professor = professor,
                Nome = $"Chamada de {aluno.Nome}" // Seu model exige a propriedade 'Nome' preenchida (MaxLength 50)
            };

            // 3. Salva no banco de dados
            _context.Presencas.Add(novaPresenca);
            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = "Presença registrada com sucesso!" });
        }

        // POST: api/Presencas/registrar-lote
        // POST: api/Presencas/registrar-lote
        [HttpPost("registrar-lote")]
        public async Task<IActionResult> RegistrarChamadaEmLote([FromBody] LoteChamadaRequest lote)
        {
            var professor = await _context.Professores.FindAsync(lote.IdProfessor);
            if (professor == null)
            {
                return NotFound(new { Mensagem = "Professor não encontrado." });
            }

            var novasPresencas = new List<Presenca>();

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
                        Nome = lote.NomeChamada // <-- AGORA ATRIBUI O NOME DINAMICAMENTE
                    });
                }
            }

            _context.Presencas.AddRange(novasPresencas);
            await _context.SaveChangesAsync();

            return Ok(new { Mensagem = $"{novasPresencas.Count} registros de '{lote.NomeChamada}' salvos com sucesso!" });
        }
    }
    }
}