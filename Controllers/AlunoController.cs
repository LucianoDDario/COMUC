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
using System.Threading.Tasks;

namespace ComucAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AlunoController : ControllerBase
    {
        private readonly ComucDbContext _context;

        public AlunoController(ComucDbContext context)
        {
            _context = context;
        }

        // GET: api/Aluno?bolsista=true
        [HttpGet]
        public async Task<ActionResult> GetAlunos([FromQuery] bool? bolsista)
        {
            var query = _context.Alunos
                .Include(a => a.Bandas)
                .AsQueryable();

            if (bolsista.HasValue)
                query = query.Where(a => a.Bolsista == bolsista.Value);

            var bandaLookup = await _context.Bandas
                .Include(b => b.BandaPai)
                .ToDictionaryAsync(b => b.IdBanda, b => b.BandaPai != null
                    ? b.BandaPai.Nome + " - " + b.Nome
                    : b.Nome);

            var alunosRaw = await query.ToListAsync();

            var alunos = alunosRaw.Select(a => new
            {
                IdAluno = a.IdAluno,
                Nome = a.Nome,
                Bolsista = a.Bolsista,
                MotivoSaida = a.MotivoSaida,
                Bandas = a.Bandas.Select(b => new
                {
                    b.IdBanda,
                    Nome = bandaLookup.TryGetValue(b.IdBanda, out var nome) ? nome : b.Nome
                }).ToList()
            });

            return Ok(alunos);
        }

        // GET: api/Aluno/5
        [HttpGet("{id}")]
        public async Task<ActionResult> GetAluno(int id)
        {
            var aluno = await _context.Alunos
                .Include(a => a.Bandas).ThenInclude(b => b.BandaPai)
                .Where(a => a.IdAluno == id)
                .Select(a => new
                {
                    a.IdAluno,
                    a.Nome,
                    a.DataNascimento,
                    a.Telefone,
                    a.CPF,
                    a.RG,
                    a.Endereco,
                    a.NomePai,
                    a.NomeMae,
                    a.DocumentoResponsavel,
                    a.Bolsista,
                    a.DataInicio,
                    a.MotivoSaida,
                    a.PossuiInstrumento,
                    a.TamanhoVestimenta,
                    Bandas = a.Bandas.Select(b => new { b.IdBanda, b.Nome }).ToList()
                })
                .FirstOrDefaultAsync();

            if (aluno == null)
                return NotFound();

            return Ok(aluno);
        }

        // PUT: api/Aluno/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAluno(int id, AlunoEditDTO dto)
        {
            if (id != dto.IdAluno)
                return BadRequest();

            var aluno = await _context.Alunos
                .Include(a => a.Bandas)
                .FirstOrDefaultAsync(a => a.IdAluno == id);

            if (aluno == null)
                return NotFound();

            if (await _context.Alunos.AnyAsync(a => a.CPF == dto.CPF && a.IdAluno != id))
                return Conflict(new { Mensagem = "Já existe um aluno cadastrado com este CPF." });

            if (await _context.Alunos.AnyAsync(a => a.RG == dto.RG && a.IdAluno != id))
                return Conflict(new { Mensagem = "Já existe um aluno cadastrado com este RG." });

            aluno.Nome = dto.Nome;
            aluno.DataNascimento = dto.DataNascimento;
            aluno.Telefone = dto.Telefone;
            aluno.CPF = dto.CPF;
            aluno.RG = dto.RG;
            aluno.Endereco = dto.Endereco;
            aluno.NomePai = dto.NomePai;
            aluno.NomeMae = dto.NomeMae;
            aluno.DocumentoResponsavel = dto.DocumentoResponsavel;
            aluno.Bolsista = dto.Bolsista;
            aluno.DataInicio = dto.DataInicio;
            aluno.MotivoSaida = dto.MotivoSaida;
            aluno.PossuiInstrumento = dto.PossuiInstrumento;
            aluno.TamanhoVestimenta = dto.TamanhoVestimenta;

            var bandasSelecionadas = await _context.Bandas
                .Where(b => dto.IdBandas.Contains(b.IdBanda))
                .ToListAsync();

            aluno.Bandas.Clear();
            foreach (var banda in bandasSelecionadas)
                aluno.Bandas.Add(banda);

            if (bandasSelecionadas.Count > 0)
                aluno.MotivoSaida = string.Empty;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Aluno
        [HttpPost]
        public async Task<ActionResult<Aluno>> PostAluno([FromBody] AlunoCreateDTO dto)
        {
            // 1. Verifica CPF e RG duplicados
            if (await _context.Alunos.AnyAsync(a => a.CPF == dto.CPF))
                return Conflict(new { Mensagem = "Já existe um aluno cadastrado com este CPF." });

            if (await _context.Alunos.AnyAsync(a => a.RG == dto.RG))
                return Conflict(new { Mensagem = "Já existe um aluno cadastrado com este RG." });

            // 2. Busca no banco de dados todas as bandas cujos IDs foram enviados no DTO
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
                RG = dto.RG,
                Endereco = dto.Endereco,
                NomePai = dto.NomePai,
                NomeMae = dto.NomeMae,
                DocumentoResponsavel = dto.DocumentoResponsavel,
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
