using Microsoft.AspNetCore.Mvc;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using OrtoProtesiApi.DTOs;
using OrtoProtesiApi.Services;

namespace OrtoProtesiApi.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class ClientiController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _env;

        public ClientiController(DataContext context, IEmailService emailService, IWebHostEnvironment env)
        {
            _context = context;
            _emailService = emailService;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClienti()
        {
            return await _context.Clienti.ToListAsync();
        }

        [HttpGet("dettaglio/{id}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clienti.FindAsync(id);
            if (cliente == null) return NotFound();
            return cliente;
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetById(int id)
        {
            var cliente = await _context.Clienti.FindAsync(id);
            if (cliente == null) return NotFound();
            return Ok(cliente);
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> AddCliente(Cliente cliente)
        {
            //_context.Clienti.Add(cliente);
            if (cliente.UtenteId == 0)
                return BadRequest("UtenteId obbligatorio");

            _context.Clienti.Add(cliente);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("from-utente/{utenteId}")]
        public async Task<ActionResult<object>> GetClienteFromUtente(int utenteId)
        {
            var utente = await _context.Utenti
            .Include(u => u.Cliente)
            .FirstOrDefaultAsync(u => u.Id == utenteId);

            if (utente == null) return NotFound();
            if (utente.Cliente == null) return NotFound("Cliente non ancora compilato");

            var c = utente.Cliente;
            var result = new
            {

                NomeDottore = c.NomeDottore,
                CognomeDottore = c.CognomeDottore,
                Email = c.Email,
                TelefonoCellulare = c.TelefonoCellulare,
                CodiceFiscale = c.CodiceFiscale
            };

            return Ok(result);
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCliente(int id, Cliente cliente)
        {
            if (id != cliente.Id) return BadRequest();

            _context.Entry(cliente).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Clienti.Any(c => c.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clienti
                .Include(c => c.Utente)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cliente == null) return NotFound();

            // Ottieni l'email per cercare gli inviti correlati
            var emailCliente = cliente.Email;

            // Recupera e rimuovi eventuali inviti associati a questa email
            var inviti = await _context.InvitiMedici
                .Where(i => i.Email == emailCliente)
                .ToListAsync();

            if (inviti.Any())
            {
                _context.InvitiMedici.RemoveRange(inviti);
            }

            // Rimuovi il cliente
            _context.Clienti.Remove(cliente);

            // Se c'è un utente associato, elimina anche quello
            if (cliente.Utente != null)
            {
                _context.Utenti.Remove(cliente.Utente);
            }

            // Elimina anche le lavorazioni associate (opzionale, dipende dai requisiti)
            var lavorazioniCliente = await _context.Lavorazioni
                .Where(l => l.ClienteId == id)
                .ToListAsync();

            if (lavorazioniCliente.Any())
            {
                _context.Lavorazioni.RemoveRange(lavorazioniCliente);
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("invita-medico")]
        public async Task<IActionResult> InvitaMedico([FromBody] InvitaMedicoDTO dto)
        {
            if (_context.Utenti.Any(u => u.Email == dto.Email))
                return BadRequest("Email già registrata");

            var tempPassword = string.IsNullOrWhiteSpace(dto.PasswordTemporanea) 
                ? Path.GetRandomFileName()[..12] 
                : dto.PasswordTemporanea;

            var nuovoUtente = new Utente
            {
                Email = dto.Email,
                Nome = dto.NomeDottore,
                Cognome = dto.CognomeDottore,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                Ruolo = RuoloUtente.Medico,
                EmailVerificata = true
            };
            _context.Utenti.Add(nuovoUtente);
            await _context.SaveChangesAsync();

            var cliente = new Cliente
            {
                UtenteId = nuovoUtente.Id,
                NomeDottore = dto.NomeDottore,
                CognomeDottore = dto.CognomeDottore,
                Email = dto.Email,
                TelefonoCellulare = dto.TelefonoCellulare,
                TelefonoFisso = dto.TelefonoFisso,
                PartitaIva = dto.PartitaIva,
                CodiceFiscale = dto.CodiceFiscale,
                NomeStudio = dto.NomeStudio,
                ViaStudio = dto.ViaStudio,
                CittaStudio = dto.CittaStudio,
                CodiceSDI = dto.CodiceSDI
            };
            _context.Clienti.Add(cliente);
            await _context.SaveChangesAsync();

            var invito = new InvitoMedico
            {
                Email = dto.Email,
                PasswordTemporanea = tempPassword,
                Nome = dto.NomeDottore,
                Cognome = dto.CognomeDottore,
                DataInvito = DateTime.UtcNow
            };
            _context.InvitiMedici.Add(invito);
            await _context.SaveChangesAsync();

            return Ok(invito);
        }

        [HttpGet("lista-inviti")]
        public async Task<ActionResult<List<InvitoMedico>>> ListaInviti()
        {
            return await _context.InvitiMedici.OrderByDescending(i => i.DataInvito).ToListAsync();
        }

        [HttpGet("verifica-email/{email}")]
        public async Task<ActionResult<bool>> VerificaEmailEsistente(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email non specificata");

            bool esisteCliente = await _context.Clienti.AnyAsync(c => c.Email == email);
            bool esisteUtente = await _context.Utenti.AnyAsync(u => u.Email == email);

            return Ok(esisteCliente || esisteUtente);
        }

        // Controller sul backend (ClientiController.cs)
        [HttpDelete("inviti/{id}")]
        public async Task<IActionResult> DeleteInvitoMedico(int id)
        {
            var invito = await _context.InvitiMedici.FindAsync(id);
            if (invito == null) return NotFound();

            _context.InvitiMedici.Remove(invito);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
