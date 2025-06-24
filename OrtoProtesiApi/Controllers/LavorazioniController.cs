using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using OrtoProtesiApi.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using System.IO;


namespace OrtoProtesiApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class LavorazioniController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IWebHostEnvironment _env;

        public LavorazioniController(DataContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // GET: api/lavorazioni
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LavorazioneDTO>>> GetLavorazioni()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);


            var query = _context.Lavorazioni.AsQueryable();
            var ruoloStr = User.FindFirst(ClaimTypes.Role)?.Value ?? "";
            if (!ruoloStr.Equals(nameof(RuoloUtente.Admin), StringComparison.Ordinal))
                query = query.Where(l => l.CreatoDaUtenteId == userId);

            // 1) Proietto in DTO i campi base
            var list = await query
                .OrderBy(l => l.DataCreazione)
                .Include(l => l.Cliente)
                .Select(l => new LavorazioneDTO
                {
                    Id = l.Id,
                    ClienteId = l.ClienteId,
                    NomeCompletoCliente = l.ClienteId != null
                       ? $"{l.Cliente.NomeDottore} {l.Cliente.CognomeDottore}" : "-",
                    TipiLavorazione = l.TipiLavorazione,
                    Stato = l.Stato,
                    SpecificheTecniche = l.SpecificheTecniche,
                    DataCreazione = l.DataCreazione,
                    NomePaziente = l.NomePaziente,
                    CognomePaziente = l.CognomePaziente,
                    EtaPaziente = l.EtaPaziente,
                    NumeroTelefonoPaziente = l.NumeroTelefonoPaziente,
                    CodiceFiscalePaziente = l.CodiceFiscalePaziente
                    // PercorsiFile… li aggiungiamo dopo
                })
                .ToListAsync();

            // 2) Aggiungo i percorsi di immagini e stl per ciascun DTO
            foreach (var dto in list)
            {
                var uploadDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", dto.Id.ToString());
                if (Directory.Exists(uploadDir))
                {
                    dto.PercorsiFileImmagini = Directory
                        .EnumerateFiles(uploadDir)
                        .Where(f => !f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                        .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                        .ToList();

                    dto.PercorsiFileStl = Directory
                        .EnumerateFiles(uploadDir)
                        .Where(f => f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                        .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                        .ToList();
                }
            }
            return Ok(list);
        }

        // POST: api/lavorazioni/upload
        [HttpPost("upload")]
        [Authorize(Roles = "Admin,Medico")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> CreateConFile([FromForm] LavorazioneFormDTO dto)
        {
            // 1) se ModelState invalido, ritorno dettagli
            if (!ModelState.IsValid)
            {
                // log in console
                Console.WriteLine("ModelState non valido in CreateConFile:");
                foreach (var kv in ModelState)
                {
                    Console.WriteLine("ModelState non valido:");
                    foreach (var err in kv.Value.Errors)
                    {
                        Console.WriteLine($"  {kv.Key}: {err.ErrorMessage}");
                    }
                }
                return BadRequest(ModelState);
            }

            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null) return Unauthorized();
                int userId = int.Parse(userIdClaim.Value);

                int? clienteId = dto.ClienteId;

                if (User.IsInRole("Medico"))
                {
                    //Recupera i dati dall utente
                    var utente = await _context.Utenti.FindAsync(userId);
                    if (utente == null) return NotFound("Utente non trovato");

                    //Controlla se l'utente è associato a un cliente
                    var cliente = await _context.Clienti
                        .FirstOrDefaultAsync(c => c.Email.ToLower() == utente.Email.ToLower());

                    if (cliente != null)
                    {
                        //usa l ID cliente trovato
                        clienteId = cliente.Id;
                        Console.WriteLine($"ID cliente trovato: {clienteId}");
                    }
                    else
                    {
                        Console.WriteLine("Nessun cliente associato all'utente");
                        return BadRequest("Nessun cliente associato all'utente");
                    }
                }

                //Log per debug
                Console.WriteLine($"Creazione lavorazione: utente {userId}, ruolo {User.FindFirst(ClaimTypes.Role)?.Value}");
                Console.WriteLine($"DTO: ClienteId={dto.ClienteId}, NomePaziente={dto.NomePaziente}");

                var lav = new Lavorazione
                {
                    ClienteId = clienteId,//User.IsInRole("Admin") ? dto.ClienteId : null,
                    CreatoDaUtenteId = userId,
                    Stato = dto.Stato,
                    SpecificheTecniche = dto.SpecificheTecniche,
                    NomePaziente = dto.NomePaziente,
                    CognomePaziente = dto.CognomePaziente,
                    EtaPaziente = dto.EtaPaziente,
                    NumeroTelefonoPaziente = dto.NumeroTelefonoPaziente,
                    CodiceFiscalePaziente = dto.CodiceFiscalePaziente,
                    TipiLavorazione = System.Text.Json.JsonSerializer.Deserialize<List<string>>(dto.TipiLavorazioneJson) ?? new List<string>(),
                    DataCreazione = DateTime.UtcNow
                };

                _context.Lavorazioni.Add(lav);
                await _context.SaveChangesAsync();

                var basePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", lav.Id.ToString());
                Directory.CreateDirectory(basePath);

                // salvo le immagini
                foreach (var img in dto.Immagini)
                {
                    var filePath = Path.Combine(basePath, img.FileName);
                    await using var stream = new FileStream(filePath, FileMode.Create);
                    await img.CopyToAsync(stream);
                }

                // salvo gli STL
                foreach (var stl in dto.StlFile)
                {
                    var filePath = Path.Combine(basePath, stl.FileName);
                    Console.WriteLine($"Salvataggio file STL: {filePath}");
                    await using var stream = new FileStream(filePath, FileMode.Create);
                    await stl.CopyToAsync(stream);

                    //Verifica dopo il salvataggio
                    if (System.IO.File.Exists(filePath))
                    {
                        var fileInfo = new FileInfo(filePath);
                        Console.WriteLine($"STL salvato correttamente: {filePath} ({fileInfo.Length} bytes)");
                    }
                    else
                    {
                        Console.WriteLine($"Errore: STL non trovato dopo il salvataggio: {filePath}");
                    }
                }

                var responseDto = new LavorazioneDTO
                {
                    Id = lav.Id,
                    ClienteId = lav.ClienteId,
                    CreatoDaUtenteId = lav.CreatoDaUtenteId,
                    Stato = lav.Stato,
                    SpecificheTecniche = lav.SpecificheTecniche,
                    NomePaziente = lav.NomePaziente,
                    CognomePaziente = lav.CognomePaziente,
                    EtaPaziente = lav.EtaPaziente,
                    NumeroTelefonoPaziente = lav.NumeroTelefonoPaziente,
                    CodiceFiscalePaziente = lav.CodiceFiscalePaziente,
                    TipiLavorazione = lav.TipiLavorazione,
                    DataCreazione = lav.DataCreazione
                };

                return CreatedAtAction(nameof(GetById), new { id = lav.Id }, responseDto);

            }
            catch (Exception ex)
            {
                // log completo per debug
                Console.WriteLine("ERRORE in CreateConFile: " + ex);
                return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
            }
        }

        // GET by id
        [HttpGet("{id}")]
        public async Task<ActionResult<LavorazioneDTO>> GetById(int id)
        {
            var l = await _context.Lavorazioni.FindAsync(id);
            if (l == null) return NotFound();

            // Crea un DTO per evitare la serializzazione ciclica
            var dto = new LavorazioneDTO
            {
                Id = l.Id,
                ClienteId = l.ClienteId,
                CreatoDaUtenteId = l.CreatoDaUtenteId,
                NomeCompletoCliente = l.ClienteId != null && l.Cliente != null
                    ? $"{l.Cliente.NomeDottore} {l.Cliente.CognomeDottore}" : "-",
                TipiLavorazione = l.TipiLavorazione,
                Stato = l.Stato,
                SpecificheTecniche = l.SpecificheTecniche,
                DataCreazione = l.DataCreazione,
                NomePaziente = l.NomePaziente,
                CognomePaziente = l.CognomePaziente,
                EtaPaziente = l.EtaPaziente,
                NumeroTelefonoPaziente = l.NumeroTelefonoPaziente,
                CodiceFiscalePaziente = l.CodiceFiscalePaziente
            };

            // Aggiungi i percorsi di file
            var uploadDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", dto.Id.ToString());
            if (Directory.Exists(uploadDir))
            {
                dto.PercorsiFileImmagini = Directory
                    .EnumerateFiles(uploadDir)
                    .Where(f => !f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                    .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                    .ToList();

                dto.PercorsiFileStl = Directory
                    .EnumerateFiles(uploadDir)
                    .Where(f => f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                    .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                    .ToList();
            }

            return dto;
        }
        // PUT aggiornamento (solo admin)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromBody] Lavorazione lav)
        {
            if (id != lav.Id) return BadRequest("ID mismatch");
            var existing = await _context.Lavorazioni.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Stato = lav.Stato;
            existing.SpecificheTecniche = lav.SpecificheTecniche;
            existing.TipiLavorazione = lav.TipiLavorazione;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE (solo admin)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin, Medico")]
        public async Task<IActionResult> Delete(int id)
        {
            var l = await _context.Lavorazioni.FindAsync(id);
            if (l == null) return NotFound();
            _context.Lavorazioni.Remove(l);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Medico")]
        [HttpGet("mie-lavorazioni")]
        public async Task<ActionResult<IEnumerable<LavorazioneDTO>>> GetMieLavorazioni()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            var list = await _context.Lavorazioni
                .Where(l => l.CreatoDaUtenteId == userId)
                .OrderByDescending(l => l.DataCreazione)
                .Select(l => new LavorazioneDTO
                {
                    Id = l.Id,
                    ClienteId = l.ClienteId,
                    CreatoDaUtenteId = l.CreatoDaUtenteId,
                    NomeCompletoCliente = l.ClienteId != null && l.Cliente != null
                        ? $"{l.Cliente.NomeDottore} {l.Cliente.CognomeDottore}" : "-",
                    TipiLavorazione = l.TipiLavorazione,
                    Stato = l.Stato,
                    SpecificheTecniche = l.SpecificheTecniche,
                    DataCreazione = l.DataCreazione,
                    NomePaziente = l.NomePaziente,
                    CognomePaziente = l.CognomePaziente,
                    EtaPaziente = l.EtaPaziente,
                    NumeroTelefonoPaziente = l.NumeroTelefonoPaziente,
                    CodiceFiscalePaziente = l.CodiceFiscalePaziente
                })
                .ToListAsync();
                var count = await _context.Lavorazioni.CountAsync(l => l.CreatoDaUtenteId == userId);
            // Aggiungi percorsi dei file
            foreach (var dto in list)
            {
                var uploadDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", dto.Id.ToString());
                if (Directory.Exists(uploadDir))
                {
                    dto.PercorsiFileImmagini = Directory
                        .EnumerateFiles(uploadDir)
                        .Where(f => !f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                        .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                        .ToList();

                    dto.PercorsiFileStl = Directory
                        .EnumerateFiles(uploadDir)
                        .Where(f => f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                        .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                        .ToList();
                }
            }

            return Ok(list);
        }

        [HttpGet("bycliente/{idCliente}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<LavorazioneDTO>>> GetByCliente(int idCliente)
        {
            var list = await _context.Lavorazioni
                .Where(l => l.ClienteId == idCliente)
                .OrderByDescending(l => l.DataCreazione)
                .Include(l => l.Cliente)
                .Select(l => new LavorazioneDTO
                {
                    Id = l.Id,
                    ClienteId = l.ClienteId,
                    NomeCompletoCliente = l.ClienteId != null
                        ? $"{l.Cliente.NomeDottore} {l.Cliente.CognomeDottore}" : "-",
                    TipiLavorazione = l.TipiLavorazione,
                    Stato = l.Stato,
                    SpecificheTecniche = l.SpecificheTecniche,
                    DataCreazione = l.DataCreazione,
                    NomePaziente = l.NomePaziente,
                    CognomePaziente = l.CognomePaziente,
                    EtaPaziente = l.EtaPaziente,
                    NumeroTelefonoPaziente = l.NumeroTelefonoPaziente,
                    CodiceFiscalePaziente = l.CodiceFiscalePaziente
                })
                .ToListAsync();

            foreach (var dto in list)
            {
                var uploadDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", dto.Id.ToString());
                if (Directory.Exists(uploadDir))
                {
                    dto.PercorsiFileImmagini = Directory
                        .EnumerateFiles(uploadDir)
                        .Where(f => !f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                        .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                        .ToList();

                    dto.PercorsiFileStl = Directory
                        .EnumerateFiles(uploadDir)
                        .Where(f => f.EndsWith(".stl", StringComparison.OrdinalIgnoreCase))
                        .Select(f => $"{Request.Scheme}://{Request.Host}/uploads/{dto.Id}/{Path.GetFileName(f)}")
                        .ToList();
                }
            }

            return Ok(list);
        }

        [HttpGet("download-stl/{id}/{filename}")]
        [AllowAnonymous]
        public IActionResult DownloadStl(int id, string filename)
        {
            var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", id.ToString(), filename);

            //Console.WriteLine($"Richiesta download STL: {filePath}");

            if (!System.IO.File.Exists(filePath))
            {
                Console.WriteLine($"File non trovato: {filePath}");
                return NotFound($"File non trovato: {filePath}");
            }

            Console.WriteLine($"File trovato, dimensione: {new FileInfo(filePath).Length} bytes");

            var memory = new MemoryStream();
            using (var stream = new FileStream(filePath, FileMode.Open))
            {
                stream.CopyTo(memory);
            }
            memory.Position = 0;

            return File(memory, "application/octet-stream", filename);
        }

        [HttpGet("download-image/{id}/{filename}")]
        [AllowAnonymous]
        public IActionResult DownloadImage(int id, string filename)
        {
            var filePath = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", id.ToString(), filename);

            //Console.WriteLine($"Richiesta download immagine: {filePath}");

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound($"Immagine non trovata: {filePath}");
            }

            // Determina il content type in base all'estensione
            string contentType;
            string ext = Path.GetExtension(filename).ToLowerInvariant();

            switch (ext)
            {
                case ".jpg":
                case ".jpeg":
                    contentType = "image/jpeg";
                    break;
                case ".png":
                    contentType = "image/png";
                    break;
                case ".gif":
                    contentType = "image/gif";
                    break;
                case ".bmp":
                    contentType = "image/bmp";
                    break;
                default:
                    contentType = "application/octet-stream";
                    break;
            }
            return PhysicalFile(filePath, contentType);
        }

    }
}
