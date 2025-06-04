
namespace OrtoProtesiApi.DTOs
{
    public class LavorazioneDTO
    {
        public int Id { get; set; }
        public int? ClienteId { get; set; }
         public int CreatoDaUtenteId { get; set; }
        public string NomePaziente { get; set; } = string.Empty;
        public string CognomePaziente { get; set; } = string.Empty;
        public int? EtaPaziente { get; set; }
        public string? NumeroTelefonoPaziente { get; set; } = string.Empty;
        public string? CodiceFiscalePaziente { get; set; } = string.Empty;
        public string NomeCompletoCliente { get; set; } = string.Empty;
        public List<string> TipiLavorazione { get; set; } = new();
        public string Stato { get; set; } = string.Empty;
        public string SpecificheTecniche { get; set; } = string.Empty;
        public DateTime DataCreazione { get; set; } = DateTime.Now;

        public List<string> PercorsiFileImmagini { get; set; } = new();
        public List<string> PercorsiFileStl { get; set; } = new();
    }
}