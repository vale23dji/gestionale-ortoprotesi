namespace OrtoProtesiApi.DTOs
{
    public class RegisterDTO
    {
        public required string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Cognome { get; set; } = string.Empty;
        public string? Ruolo { get; set; }
        
    }
}