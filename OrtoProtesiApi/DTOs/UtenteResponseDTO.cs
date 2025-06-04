namespace OrtoProtesiApi.DTOs
{
    public class UtenteResponseDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Cognome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Ruolo { get; set; } = string.Empty;
    }
}