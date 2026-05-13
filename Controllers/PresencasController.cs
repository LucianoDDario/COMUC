using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComucAPI.Data;
using ComucAPI.Models;

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

        // GET: api/Presencas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Presenca>>> GetPresencas()
        {
            return await _context.Presencas.ToListAsync();
        }

        // GET: api/Presencas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Presenca>> GetPresenca(int id)
        {
            var presenca = await _context.Presencas.FindAsync(id);

            if (presenca == null)
            {
                return NotFound();
            }

            return presenca;
        }

        // PUT: api/Presencas/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPresenca(int id, Presenca presenca)
        {
            if (id != presenca.IdPresenca)
            {
                return BadRequest();
            }

            _context.Entry(presenca).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PresencaExists(id))
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

        // POST: api/Presencas
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Presenca>> PostPresenca(Presenca presenca)
        {
            _context.Presencas.Add(presenca);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPresenca", new { id = presenca.IdPresenca }, presenca);
        }

        // DELETE: api/Presencas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePresenca(int id)
        {
            var presenca = await _context.Presencas.FindAsync(id);
            if (presenca == null)
            {
                return NotFound();
            }

            _context.Presencas.Remove(presenca);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PresencaExists(int id)
        {
            return _context.Presencas.Any(e => e.IdPresenca == id);
        }
    }
}
