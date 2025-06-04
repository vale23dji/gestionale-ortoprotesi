namespace OrtoProtesiApi.DTOs;

public class InvitaMedicoDTO
{
    public string Email { get; set; } = string.Empty;
    public string NomeDottore { get; set; } = string.Empty;
    public string CognomeDottore { get; set; } = string.Empty;
    public string TelefonoCellulare { get; set; } = string.Empty;
    public string TelefonoFisso { get; set; } = string.Empty;
    public string PartitaIva { get; set; } = string.Empty;
    public string CodiceFiscale { get; set; } = string.Empty;
    public string NomeStudio { get; set; } = string.Empty;
    public string ViaStudio { get; set; } = string.Empty;
    public string CittaStudio { get; set; } = string.Empty;
    public string CodiceSDI { get; set; } = string.Empty;
    public string? PasswordTemporanea { get; set; }
}
