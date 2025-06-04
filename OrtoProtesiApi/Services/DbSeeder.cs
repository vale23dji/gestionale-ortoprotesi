using Microsoft.EntityFrameworkCore;
using OrtoProtesiApi.Models;

namespace OrtoProtesiApi.Services;

public static class DbSeeder
{
    public static void SeedAdmin(WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var db  = scope.ServiceProvider.GetRequiredService<OrtoProtesiApi.Data.DataContext>();

        var pwd = "Orto!25?"; // Define the 'pwd' variable with the desired password

        if (db.Utenti.Any(u => u.Email == "alan.ahmad@gmail.com"))
            return; // admin già presente

        var admin = new Utente
        {
            Email            = "alan.ahmad@gmail.com",
            Nome             = "Alan",
            Cognome          = "Ahmad",
            PasswordHash     = BCrypt.Net.BCrypt.HashPassword(pwd),
            Ruolo            = RuoloUtente.Admin,
            EmailVerificata  = true
        };

        db.Utenti.Add(admin);
        db.SaveChanges();

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($">>> Admin seed creato – alan.ahmad@gmail.com / Orto!25?");
        Console.ResetColor();
    }
}
