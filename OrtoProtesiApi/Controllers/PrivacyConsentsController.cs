using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;

namespace OrtoProtesiApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PrivacyConsentsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly ILogger<PrivacyConsentsController> _logger;

        public PrivacyConsentsController(DataContext context, ILogger<PrivacyConsentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> RegisterConsent([FromBody] PrivacyConsent model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Verifica che l'utente stia modificando i propri consensi
            var userId = int.Parse(User.FindFirst("nameid")?.Value ?? "0");
            if (userId != model.UtenteId && !User.IsInRole("admin"))
            {
                return Forbid();
            }
            
            // Aggiungi l'indirizzo IP dalla richiesta
            model.IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            
            // Salva la data attuale del server per maggiore precisione
            model.DataAccettazione = DateTime.UtcNow;
            
            _context.PrivacyConsents.Add(model);
            
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Privacy consent registered for user {model.UtenteId} from IP {model.IPAddress}");
                return Ok(true);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error registering privacy consent: {ex.Message}");
                return StatusCode(500, "Error registering privacy consent");
            }
        }

        [HttpGet("{userId}/latest")]
        public async Task<IActionResult> GetLatestConsent(int userId)
        {
            // Verifica che l'utente richieda i propri consensi o sia un admin
            var currentUserId = int.Parse(User.FindFirst("nameid")?.Value ?? "0");
            if (currentUserId != userId && !User.IsInRole("admin"))
            {
                return Forbid();
            }
            
            var latestConsent = await _context.PrivacyConsents
                .OrderByDescending(p => p.DataAccettazione)
                .FirstOrDefaultAsync(p => p.UtenteId == userId);
                
            if (latestConsent == null)
            {
                return NotFound();
            }
            
            return Ok(latestConsent);
        }
        
        // Endpoint per la richiesta di esportazione dati (diritto di accesso GDPR)
        [HttpGet("/api/users/{userId}/data-export")]
        public async Task<IActionResult> ExportUserData(int userId)
        {
            var currentUserId = int.Parse(User.FindFirst("nameid")?.Value ?? "0");
            if (currentUserId != userId && !User.IsInRole("admin"))
            {
                return Forbid();
            }
            
            try 
            {
                // Recupera i dati dell'utente
                var user = await _context.Utenti
                    .FirstOrDefaultAsync(u => u.Id == userId);
                
                if (user == null)
                {
                    return NotFound("Utente non trovato");
                }
                
                // Recupera le lavorazioni dell'utente separatamente
                var lavorazioni = await _context.Lavorazioni
                    .Where(l => l.CreatoDaUtenteId == userId)
                    .ToListAsync();
                
                // Recupera i consensi sulla privacy
                var consents = await _context.PrivacyConsents
                    .Where(pc => pc.UtenteId == userId)
                    .OrderByDescending(pc => pc.DataAccettazione)
                    .ToListAsync();
                
                // Preparazione del file zip
                var tempPath = Path.Combine(Path.GetTempPath(), $"user_data_{userId}_{DateTime.Now:yyyyMMdd_HHmmss}");
                Directory.CreateDirectory(tempPath);
                
                // File di dati personali
                var userDataPath = Path.Combine(tempPath, "dati_personali.json");
                var userData = new
                {
                    Id = user.Id,
                    Nome = user.Nome,
                    Cognome = user.Cognome,
                    Email = user.Email,
                    Ruolo = user.Ruolo.ToString(),
                    // DataRegistrazione non esiste nel modello Utente
                    EmailVerificata = user.EmailVerificata
                };
                System.IO.File.WriteAllText(userDataPath, System.Text.Json.JsonSerializer.Serialize(userData, new System.Text.Json.JsonSerializerOptions 
                { 
                    WriteIndented = true 
                }));
                
                // File di lavorazioni
                var lavorazioniPath = Path.Combine(tempPath, "lavorazioni.json");
                var lavorazioniData = lavorazioni.Select(l => new
                {
                    l.Id,
                    // Selezioniamo i campi corretti dalla classe Lavorazione
                    TipiLavorazione = l.TipiLavorazione,
                    l.Stato,
                    l.DataCreazione,
                    l.SpecificheTecniche,
                    NomePaziente = l.NomePaziente,
                    CognomePaziente = l.CognomePaziente,
                    // altri campi rilevanti...
                }).ToList();
                System.IO.File.WriteAllText(lavorazioniPath, System.Text.Json.JsonSerializer.Serialize(lavorazioniData, new System.Text.Json.JsonSerializerOptions 
                { 
                    WriteIndented = true 
                }));
                
                // File di consensi privacy
                var consentsPath = Path.Combine(tempPath, "consensi_privacy.json");
                var consentsData = consents.Select(c => new
                {
                    c.DataAccettazione,
                    c.VersionePolicy,
                    c.Privacy,
                    c.Marketing,
                    c.Cookie,
                    c.Termini,
                    c.Gdpr
                }).ToList();
                System.IO.File.WriteAllText(consentsPath, System.Text.Json.JsonSerializer.Serialize(consentsData, new System.Text.Json.JsonSerializerOptions 
                { 
                    WriteIndented = true 
                }));
                
                // Crea lo ZIP
                var zipPath = Path.Combine(Path.GetTempPath(), $"user_data_{userId}.zip");
                if (System.IO.File.Exists(zipPath))
                {
                    System.IO.File.Delete(zipPath); 
                }
                
                ZipFile.CreateFromDirectory(tempPath, zipPath);
                
                // Pulisce i file temporanei
                Directory.Delete(tempPath, true);
                
                // Restituisce il file ZIP
                var fileBytes = System.IO.File.ReadAllBytes(zipPath);
                System.IO.File.Delete(zipPath); // Elimina il file ZIP temporaneo dopo la lettura
                
                return File(fileBytes, "application/zip", $"dati_personali_{userId}_{DateTime.Now:yyyyMMdd}.zip");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Errore nell'esportazione dei dati dell'utente {userId}: {ex.Message}");
                return StatusCode(500, "Si è verificato un errore nell'esportazione dei dati.");
            }
        }
        
        // Endpoint per la richiesta di cancellazione dati (diritto all'oblio GDPR)
        [HttpPost("/api/users/{userId}/data-deletion-request")]
        public async Task<IActionResult> RequestDataDeletion(
            int userId,
            [FromBody] DeletionRequestModel model)
        {
            var currentUserId = int.Parse(User.FindFirst("nameid")?.Value ?? "0");
            if (currentUserId != userId && !User.IsInRole("admin"))
            {
                return Forbid();
            }
            
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
                
                // In un sistema reale, qui si potrebbe inviare una email agli amministratori
                // e anche una conferma all'utente
                
                return Ok(new { message = "Richiesta di cancellazione registrata con successo" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error registering deletion request for user {userId}: {ex.Message}");
                return StatusCode(500, "Errore nella registrazione della richiesta di cancellazione");
            }
        }
    }
}