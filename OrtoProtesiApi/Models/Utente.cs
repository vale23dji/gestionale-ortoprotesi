//  File: Models/Utente.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace OrtoProtesiApi.Models;

public class Utente
{
    public int Id { get; set; }

    [Required, EmailAddress] public string Email        { get; set; } = string.Empty;
    [Required]                public string PasswordHash{ get; set; } = string.Empty;
    [Required]                public string Nome        { get; set; } = string.Empty;
    [Required]                public string Cognome     { get; set; } = string.Empty;

    public RuoloUtente Ruolo        { get; set; } = RuoloUtente.Medico;
    public bool        EmailVerificata { get; set; }

    // 1-a-1 (opzionale finché il medico non compila i dati)
    [JsonIgnore]
    public Cliente? Cliente { get; set; }
}
