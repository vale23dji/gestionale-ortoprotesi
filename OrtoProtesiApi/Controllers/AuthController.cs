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

    public AuthController(DataContext context, IConfiguration configuration, IEmailService emailService)
    {
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
    }


    [AllowAnonymous]
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDTO request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email e password sono obbligatori");

        var user = _context.Utenti.FirstOrDefault(u =>
            u.Email.ToLower() == request.Email.ToLower());
            if (user == null)
               return Unauthorized("Credenziali non valide");


            if (!VerifyPassword(request.Password, user.PasswordHash))

                return Unauthorized("Credenziali non valide");

            //if (!user.EmailVerificata)
              // return Unauthorized("Email non verificata. Controlla la tua cassella di posta.");    
            
           var token = GenerateJwtToken(user);

        return Ok(new
        {
            Token = token,
            Utente = new UtenteResponseDTO
            {
                Id = user.Id,
                Nome = user.Nome,
                Cognome = user.Cognome,
                Email = user.Email,
                Ruolo = user.Ruolo.ToString()
               
            }
        });
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDTO request)
    {
      try
      {
        var existingUser = _context.Utenti.FirstOrDefault(u => u.Email == request.Email);
        if (existingUser != null)
        {
            //Console.WriteLine($"Utente già registrato con email: {request.Email}");
            return BadRequest("Utente già registrato");
        }

        var newUser = new Utente
        {
            Email = request.Email,
            Nome = request.Nome,
            Cognome = request.Cognome,
            PasswordHash = HashPassword(request.Password),
            Ruolo = ParseRuolo(request.Ruolo)
        };

        _context.Utenti.Add(newUser);

        Console.WriteLine($"Dati ricevuti: {request.Nome} {request.Cognome} {request.Email} {request.Password} {request.Ruolo}");

        _context.SaveChanges();
        //await _emailService.InviaEmailAsync(request.Email, "Conferma registrazione", "Grazie per esserti registrato su OrtoProtesi!");

        var token = Guid.NewGuid().ToString();


        var emailVerification = new EmailVerification 
        {
            Email = newUser.Email,
            Token = token,
            Expiration = DateTime.UtcNow.AddHours(24)
        };

        _context.EmailVerifications.Add(emailVerification);
        Console.WriteLine($"Invio email di verifica a {newUser.Email}");
        await _emailService.SendVerificationEmail(newUser.Email, newUser.Nome, token);

        
       // if (response.IsSuccessStatusCode)
        //{
          //  Console.WriteLine("Email inviata correttamente");
        //}
        //else
       // {
         //   Console.WriteLine($"Errore durante l'invio dell'email: {response.StatusCode}");
          //  var body = await response.Body.ReadAsStringAsync();
           // Console.WriteLine($"Corpo della risposta: {body}");
        //}
        Console.WriteLine($"Email inviata (o almeno tentata)");
        await _context.SaveChangesAsync();

        Console.WriteLine($"Utente registrato con successo");
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
        Console.WriteLine("ERRORE DURANTE LA REGISTRAZIONE:");
        Console.WriteLine(ex.Message);
        if (ex.InnerException != null)
            Console.WriteLine("INNER: " + ex.InnerException.Message);
        Console.WriteLine(ex.StackTrace);
        return StatusCode(500, "Errore interno del server");
      }
    }

    private async Task SendVerificationEmail(string toEmail, string token)
    {
        await _emailService.InviaEmailAsync(toEmail, "Conferma la tua email", $"Clicca qui per verificare: http://localhost:4200/verifica-email?token={token} ");
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

    private bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private string GenerateJwtToken(Utente user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nome),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Ruolo.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(2),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
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
