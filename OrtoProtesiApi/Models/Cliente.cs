// Models/Cliente.cs
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace OrtoProtesiApi.Models
{
    /// <summary>
    /// Anagrafica dello studio/medico che commissiona le lavorazioni.
    /// Ogni Cliente è in rapporto 1-a-1 con un Utente (Medico).
    /// </summary>
    public class Cliente
    {
        public int Id { get; set; }

        // ─── FK verso Utente (obbligatoria) ──────────────────────────────
        public int UtenteId { get; set; }
        [JsonIgnore]
        public Utente Utente { get; set; } = null!;

        // ─── Dati anagrafici dello studio / medico ──────────────────────
        public string NomeDottore { get; set; } = string.Empty;
        public string CognomeDottore { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string TelefonoCellulare { get; set; } = string.Empty;
        public string TelefonoFisso { get; set; } = string.Empty;
        public string CodiceFiscale { get; set; } = string.Empty;
        public string PartitaIva { get; set; } = string.Empty;
        public string NomeStudio { get; set; } = string.Empty;
        public string ViaStudio { get; set; } = string.Empty;
        public string CittaStudio { get; set; } = string.Empty;
        public string CodiceSDI { get; set; } = string.Empty;

        public DateTime DataCreazione { get; set; } = DateTime.UtcNow;

        // ─── Relazione 1-a-N con Lavorazioni ────────────────────────────
        [JsonIgnore]
        public ICollection<Lavorazione>? Lavorazioni { get; set; } = new List<Lavorazione>();
    }
    
}
