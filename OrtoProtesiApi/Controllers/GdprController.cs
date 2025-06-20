using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;

namespace OrtoProtesiApi.Controllers
{
    [Authorize]
    [Route("api/gdpr")]
    [ApiController]
    public class GdprController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly ILogger<GdprController> _logger;
        private readonly IWebHostEnvironment _env;

        public GdprController(DataContext context, ILogger<GdprController> logger, IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _env = env;
        }

        // POST: api/gdpr/data-deletion-request
        [HttpPost("data-deletion-request")]
        public async Task<IActionResult> RequestDataDeletion([FromBody] DeletionRequestModel model)
        {
            var userIdClaim = User.FindFirst("nameid");
            if (userIdClaim == null) 
                return Unauthorized();
                
            int userId = int.Parse(userIdClaim.Value);
            
            try
            {
                // Registra la richiesta di cancellazione
                var deletionRequest = new DataDeletionRequest
                {
                    UtenteId = userId,
                    Motivazione = model.Motivazione ?? "", // Gestisci il caso null
                    DataRichiesta = DateTime.UtcNow,
                    StatoRichiesta = "In attesa"
                };
                
                _context.DataDeletionRequests.Add(deletionRequest);
                await _context.SaveChangesAsync();
                
                // Log della richiesta
                _logger.LogInformation($"Data deletion request registered for user {userId}");
                
                return Ok(new { message = "Richiesta di cancellazione registrata con successo" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error registering deletion request for user {userId}: {ex.Message}");
                return StatusCode(500, "Errore nella registrazione della richiesta di cancellazione");
            }
        }

        // GET: api/gdpr/data-export
        [HttpGet("data-export")]
        public async Task<IActionResult> ExportUserData()
        {
            var userIdClaim = User.FindFirst("nameid");
            if (userIdClaim == null) 
                return Unauthorized();
                
            int userId = int.Parse(userIdClaim.Value);
            
            try 
            {
                // Crea una directory temporanea per i file
                var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
                Directory.CreateDirectory(tempDir);
                
                try
                {
                    // Esporta dati utente
                    var user = await _context.Utenti.FindAsync(userId);
                    if (user == null)
                        return NotFound("Utente non trovato");

                    // 1. File dati personali
                    var userFile = Path.Combine(tempDir, "dati_utente.json");
                    var userJson = JsonSerializer.Serialize(new {
                        Id = user.Id,
                        Nome = user.Nome,
                        Cognome = user.Cognome,
                        Email = user.Email,
                        // Aggiungi altri campi pubblici dell'utente qui
                    }, new JsonSerializerOptions { WriteIndented = true });
                    await System.IO.File.WriteAllTextAsync(userFile, userJson);

                    // 2. File consensi privacy
                    var consents = await _context.PrivacyConsents
                        .Where(c => c.UtenteId == userId)
                        .OrderByDescending(c => c.DataAccettazione)
                        .ToListAsync();

                    if (consents.Any())
                    {
                        var consentsFile = Path.Combine(tempDir, "consensi_privacy.json");
                        var consentsJson = JsonSerializer.Serialize(consents.Select(c => new {
                            DataAccettazione = c.DataAccettazione,
                            Privacy = c.Privacy,
                            Marketing = c.Marketing,
                            Cookie = c.Cookie,
                            Termini = c.Termini,
                            Gdpr = c.Gdpr
                        }), new JsonSerializerOptions { WriteIndented = true });
                        await System.IO.File.WriteAllTextAsync(consentsFile, consentsJson);
                    }

                    // 3. File lavorazioni
                    var lavorazioni = await _context.Lavorazioni
                        .Where(l => l.CreatoDaUtenteId == userId)
                        .ToListAsync();

                    if (lavorazioni.Any())
                    {
                        var lavorazioniFile = Path.Combine(tempDir, "lavorazioni.json");
                        var lavorazioniJson = JsonSerializer.Serialize(lavorazioni.Select(l => new {
                            Id = l.Id,
                            DataCreazione = l.DataCreazione,
                            Stato = l.Stato,
                            NomePaziente = l.NomePaziente,
                            CognomePaziente = l.CognomePaziente,
                            Note = l.SpecificheTecniche
                        }), new JsonSerializerOptions { WriteIndented = true });
                        await System.IO.File.WriteAllTextAsync(lavorazioniFile, lavorazioniJson);
                    }

                    // Crea il file zip
                    var zipFile = Path.Combine(Path.GetTempPath(), $"dati_utente_{userId}.zip");
                    if (System.IO.File.Exists(zipFile))
                        System.IO.File.Delete(zipFile);

                    ZipFile.CreateFromDirectory(tempDir, zipFile);

                    // Leggi il file zip e restituiscilo come risposta
                    var zipBytes = await System.IO.File.ReadAllBytesAsync(zipFile);

                    // Pulisci
                    System.IO.File.Delete(zipFile);
                    Directory.Delete(tempDir, true);

                    return File(zipBytes, "application/zip", $"dati_utente_{userId}.zip");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Errore nell'esportazione dati: {ex.Message}");
                    
                    // Assicurati di pulire le risorse in caso di errore
                    if (Directory.Exists(tempDir))
                        Directory.Delete(tempDir, true);
                        
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Errore nell'esportazione dei dati dell'utente {userId}: {ex.Message}");
                return StatusCode(500, "Si è verificato un errore nell'esportazione dei dati.");
            }
        }
    }
}