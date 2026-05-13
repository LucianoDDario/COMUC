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
        [HttpPost]
        public async Task<ActionResult<Banda>> PostBanda(Banda banda)
        {
            _context.Bandas.Add(banda);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetBanda", new { id = banda.IdBanda }, banda);
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
    }
}
