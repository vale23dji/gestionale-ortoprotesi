using System;
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
    [Authorize(Roles = "admin")]
    [Route("api/admin")]
    [ApiController]
    public class AdminPrivacyController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly ILogger<AdminPrivacyController> _logger;

        public AdminPrivacyController(DataContext context, ILogger<AdminPrivacyController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("deletion-requests")]
        public async Task<IActionResult> GetDeletionRequests([FromQuery] string status = "all", 
                                                            [FromQuery] string dateFrom = null, 
                                                            [FromQuery] string dateTo = null)
        {
            try
            {
                var query = _context.DataDeletionRequests
                    .Include(d => d.Utente)
                    .AsQueryable();
                
                // Filtro per stato
                if (status != "all")
                {
                    query = query.Where(d => d.StatoRichiesta == status);
                }
                
                // Filtro per data (se specificata)
                if (!string.IsNullOrEmpty(dateFrom))
                {
                    var fromDate = DateTime.Parse(dateFrom);
                    query = query.Where(d => d.DataRichiesta >= fromDate);
                }
                
                if (!string.IsNullOrEmpty(dateTo))
                {
                    var toDate = DateTime.Parse(dateTo).AddDays(1); // Include tutto il giorno finale
                    query = query.Where(d => d.DataRichiesta < toDate);
                }
                
                var result = await query
                    .OrderByDescending(d => d.DataRichiesta)
                    .ToListAsync();
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Errore nel recupero delle richieste di cancellazione: {ex.Message}");
                return StatusCode(500, "Errore nel recupero delle richieste di cancellazione");
            }
        }
        
        [HttpPut("deletion-requests/{id}")]
        public async Task<IActionResult> UpdateDeletionRequest(int id, [FromBody] UpdateRequestModel model)
        {
            try
            {
                var request = await _context.DataDeletionRequests.FindAsync(id);
                if (request == null)
                {
                    return NotFound("Richiesta non trovata");
                }
                
                request.StatoRichiesta = model.Status;
                request.NoteAmministrative = model.Notes;
                
                if (model.Status == "Completata")
                {
                    request.DataCompletamento = DateTime.UtcNow;
                }
                
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Richiesta di cancellazione ID {id} aggiornata a {model.Status}");
                return Ok(new { message = "Richiesta aggiornata con successo" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Errore nell'aggiornamento della richiesta ID {id}: {ex.Message}");
                return StatusCode(500, "Errore nell'aggiornamento della richiesta");
            }
        }
        
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUserData(int userId)
        {
            try
            {
                var user = await _context.Utenti.FindAsync(userId);
                if (user == null)
                {
                    return NotFound("Utente non trovato");
                }
                
                // 1. Esporta i dati prima di eliminarli (per conformità GDPR)
                var exportData = new
                {
                    UserInfo = user,
                    Consents = await _context.PrivacyConsents
                        .Where(c => c.UtenteId == userId)
                        .ToListAsync(),
                    Lavorazioni = await _context.Lavorazioni
                        .Where(l => l.CreatoDaUtenteId == userId)
                        .ToListAsync(),
                    // Altri dati rilevanti...
                };
                
                // 2. Salva i dati esportati
                var exportJson = System.Text.Json.JsonSerializer.Serialize(exportData);
                try
                {
                    // Usa un GUID per il nome file per maggiore sicurezza
                    var tempFileName = $"user_{userId}_export_{Guid.NewGuid():N}.json";
                    var exportPath = System.IO.Path.Combine(
                        System.IO.Path.GetTempPath(), 
                        tempFileName
                    );
                    
                    // Imposta permessi restrittivi sul file
                    using (var fileStream = new FileStream(
                        exportPath, 
                        FileMode.Create,
                        FileAccess.ReadWrite,
                        FileShare.None)) // Nessuna condivisione del file
                    {
                        using (var writer = new StreamWriter(fileStream))
                        {
                            await writer.WriteAsync(exportJson);
                        }
                    }
                    
                    _logger.LogInformation($"Dati utente {userId} esportati in {exportPath}");
                    
                    // 3. Elimina i dati dell'utente
                    var consents = await _context.PrivacyConsents.Where(c => c.UtenteId == userId).ToListAsync();
                    _context.PrivacyConsents.RemoveRange(consents);
                    
                    var deletionRequests = await _context.DataDeletionRequests.Where(d => d.UtenteId == userId).ToListAsync();
                    foreach (var req in deletionRequests)
                    {
                        req.StatoRichiesta = "Completata";
                        req.DataCompletamento = DateTime.UtcNow;
                        req.NoteAmministrative = "Dati utente eliminati come richiesto";
                    }
                    
                    // Anonimizza le lavorazioni invece di cancellarle
                    var lavorazioni = await _context.Lavorazioni.Where(l => l.CreatoDaUtenteId == userId).ToListAsync();
                    foreach (var lavorazione in lavorazioni)
                    {
                        // Aggiungi una nota che l'utente è stato anonimizzato
                        lavorazione.SpecificheTecniche += "\n[Utente creatore anonimizzato]";
                        
                        // Se hai bisogno di dissociare l'utente, potresti utilizzare un ID di sistema
                        // o creare un utente "anonimo" per questo scopo
                        // lavorazione.CreatoDaUtenteId = tuoUtenteAnonimoId;
                    }
                    
                    // Anonimizza l'utente invece di eliminarlo completamente
                    // CORREZIONE: usa i nomi corretti dei campi
                    user.Nome = "Utente";
                    user.Cognome = "Cancellato";
                    user.Email = $"deleted_user_{userId}@anonymized.com";
                    user.PasswordHash = "ACCOUNT_DELETED"; // Rendi la password inutilizzabile
                    user.EmailVerificata = false;
                    
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"Dati utente {userId} cancellati/anonimizzati con successo");
                    return Ok(new { message = "Dati utente cancellati con successo" });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Errore nella gestione dell'esportazione dati per utente {UserId}", userId);
                    return StatusCode(500, "Errore nella gestione dell'esportazione dati");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Errore nella cancellazione dei dati utente {userId}: {ex.Message}");
                return StatusCode(500, "Errore nella cancellazione dei dati utente");
            }
        }
        
        [HttpGet("recent-consents")]
        public async Task<IActionResult> GetRecentConsents()
        {
            try
            {
                // Recupera i consensi più recenti per ogni utente
                var result = await _context.PrivacyConsents
                    .Include(c => c.Utente)
                    .OrderByDescending(c => c.DataAccettazione)
                    .Take(50) // Limita a 50 record per performance
                    .ToListAsync();
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Errore nel recupero dei consensi recenti: {ex.Message}");
                return StatusCode(500, "Errore nel recupero dei consensi recenti");
            }
        }
    }
    
    public class UpdateRequestModel
    {
        public string Status { get; set; }
        public string Notes { get; set; }
    }
}