namespace OrtoProtesiApi.Models
{
    public class InvitoMedico
    {
        public int Id { get; set; }

        public string Email { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Cognome { get; set; } = string.Empty;
        public string PasswordTemporanea { get; set; } = string.Empty;
        public DateTime DataInvito { get; set; } = DateTime.UtcNow;
    }
}