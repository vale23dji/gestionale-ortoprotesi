using Microsoft.AspNetCore.Mvc;
using OrtoProtesiApi.Data;
using OrtoProtesiApi.Models;
using OrtoProtesiApi.DTOs;
using OrtoProtesiApi.Services;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace OrtoProtesiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly DataContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger; // Aggiunto per il logging

    public AuthController(DataContext context, IConfiguration configuration, IEmailService emailService, ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }


    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest("Email e password sono obbligatori");

            // Rallenta gli attacchi di forza bruta
            await Task.Delay(300); // Piccolo ritardo di 300ms

            var user = await _context.Utenti.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == request.Email.ToLower());

            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                _logger.LogWarning("Tentativo di accesso fallito per l'email: {Email}",
                    request.Email);
                return Unauthorized("Credenziali non valide");
            }

            //if (!user.EmailVerificata)
            // return Unauthorized("Email non verificata. Controlla la tua cassella di posta.");    

            var token = GenerateJwtToken(user);
            var ruoloStr = Convert.ToString(user.Ruolo) ?? "User";
            return Ok(new
            {
                Token = token,
                Utente = new UtenteResponseDTO
                {
                    Id = user.Id,
                    Nome = user.Nome ?? string.Empty,
                    Cognome = user.Cognome ?? string.Empty,
                    Email = user.Email ?? string.Empty,
                    Ruolo = ruoloStr


                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante il login");
            return StatusCode(500, "Si è verificato un errore durante il login");
        }
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDTO request)
    {
        try
        {
            var existingUser = await _context.Utenti.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
                return BadRequest("Utente già registrato");

            var newUser = new Utente
            {
                Email = request.Email,
                Nome = request.Nome,
                Cognome = request.Cognome,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Ruolo = ParseRuolo(request.Ruolo),
                EmailVerificata = false
            };

            _context.Utenti.Add(newUser);

            var token = Guid.NewGuid().ToString();
            var emailVerification = new EmailVerification
            {
                Email = newUser.Email,
                Token = token,
                Expiration = DateTime.UtcNow.AddHours(24)
            };
            _context.EmailVerifications.Add(emailVerification);

            // Non bloccare la registrazione se l'email fallisce
            try
            {
                await _emailService.SendVerificationEmail(newUser.Email, newUser.Nome, token);
            }
            catch (Exception mailEx)
            {
                _logger.LogWarning(mailEx, "Invio email di verifica fallito per {Email}", newUser.Email);
            }

            await _context.SaveChangesAsync();

            var response = new UtenteResponseDTO
            {
                Id = newUser.Id,
                Nome = newUser.Nome,
                Cognome = newUser.Cognome,
                Email = newUser.Email,
                Ruolo = newUser.Ruolo.ToString()
            };
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ERRORE DURANTE LA REGISTRAZIONE di {Email}", request?.Email);
            return StatusCode(500, "Errore interno del server");
        }
    }


    // Modifica il token per renderlo più sicuro
    private string GenerateEmailVerificationToken()
    {
        // Genera un token più lungo (64 caratteri)
        var randomBytes = new byte[32]; // 32 byte = 256 bit
        using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return Convert.ToBase64String(randomBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('='); // URL-safe
    }

    // Modifica invio email
    private async Task SendVerificationEmail(string toEmail, string token)
    {
        // Leggi l'URL base da configurazione
        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://tuodominio.com";
        var verificationLink = $"{baseUrl}/verifica-email?token={Uri.EscapeDataString(token)}";

        // Usa un template HTML per l'email
        var emailBody = $@"
            <html>
            <body>
                <h3>Conferma la tua email per OrtoProtesi</h3>
                <p>Grazie per esserti registrato. Clicca sul link seguente per confermare il tuo account:</p>
                <p><a href='{verificationLink}'>Conferma il tuo account</a></p>
                <p>Se non hai richiesto questa email, puoi ignorarla in sicurezza.</p>
                <p>Il link scadrà tra 24 ore.</p>
            </body>
            </html>";

        await _emailService.InviaEmailAsync(
            toEmail,
            "Conferma la tua email - OrtoProtesi",
            emailBody);
    }

    [AllowAnonymous]
    [HttpGet("resend-verifica")]
    public async Task<IActionResult> ResendVerification([FromBody] string email)
    {
        var user = await _context.Utenti.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return NotFound("Utente non trovato");

        if (user.EmailVerificata)
            return BadRequest("Email già verificata");

        var token = Guid.NewGuid().ToString();

        var emailVerification = new EmailVerification
        {
            Email = email,
            Token = token,
            Expiration = DateTime.UtcNow.AddHours(24)
        };

        _context.EmailVerifications.Add(emailVerification);
        await _emailService.InviaEmailAsync(email, "Conferma registrazione", $"Clicca qui per confermare: http://localhost:4200/verifica-email?token={token}");
        await _context.SaveChangesAsync();
        return Ok("Email di verifica inviata");
    }



    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private static bool VerifyPassword(string password, string? hash)
    {
        if (string.IsNullOrWhiteSpace(hash)) return false;
        if (!(hash.StartsWith("$2a$") || hash.StartsWith("$2b$") || hash.StartsWith("$2y$"))) return false;
        try { return BCrypt.Net.BCrypt.Verify(password, hash); }
        catch (BCrypt.Net.SaltParseException) { return false; }
    }


    private string GenerateJwtToken(Utente user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var keyStr = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key missing");
        var key = Encoding.ASCII.GetBytes(keyStr);

        var expiry = DateTime.UtcNow.AddHours(1);

        // Valori safe
        var name = string.IsNullOrWhiteSpace(user.Nome) ? (user.Email ?? "user") : user.Nome;
        var email = user.Email ?? string.Empty;
        var role = Convert.ToString(user.Ruolo) ?? "User"; // funziona sia se è enum sia se è string

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role)
        }),
            Expires = expiry,
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature),
            NotBefore = DateTime.UtcNow.AddMinutes(-5)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }



    [AllowAnonymous]
    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfermaEmail([FromQuery] string token)
    {
        var verifica = await _context.EmailVerifications
            .FirstOrDefaultAsync(ev => ev.Token == token && ev.Expiration > DateTime.UtcNow);

        if (verifica == null)
            return BadRequest("Token non valido o scaduto");

        var utente = await _context.Utenti.FirstOrDefaultAsync(u => u.Email == verifica.Email);
        if (utente == null)
            return NotFound("Utente non trovato");

        utente.EmailVerificata = true;
        _context.EmailVerifications.Remove(verifica); // Elimina token utilizzato 
        await _context.SaveChangesAsync();

        return Ok("email confermata con successo.");
    }


    [HttpPost("cambia-password")]
    public async Task<IActionResult> CambiaPassword([FromBody] ChangePasswordDTO model)
    {
        if (model == null)
            return BadRequest("Payload non valido");

        var utente = await _context.Utenti.FirstOrDefaultAsync(u => u.Email == model.Email);
        if (utente == null)
            return NotFound("Utente non trovato");

        if (!BCrypt.Net.BCrypt.Verify(model.VecchiaPassword, utente.PasswordHash))
            return BadRequest("Vecchia password errata");

        utente.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.NuovaPassword);
        await _context.SaveChangesAsync();
        return Ok("Password aggiornata correttamente");
    }


    private RuoloUtente ParseRuolo(string? ruoloRequest)
    {
        return Enum.TryParse<RuoloUtente>(ruoloRequest, true, out var ruolo)
           ? ruolo
           : RuoloUtente.Medico;
    }
}
