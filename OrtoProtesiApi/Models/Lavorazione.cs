//  File: Models/Lavorazione.cs
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace OrtoProtesiApi.Models;

public class Lavorazione
{
    public int Id { get; set; }

    // ─── Cliente che commissiona (opzionale) ─────────────
    public int?     ClienteId { get; set; }
    [JsonIgnore]
    public Cliente? Cliente { get; set; }

    // ─── Utente creatore ─────────────────────────────────
    public int    CreatoDaUtenteId { get; set; }      // FK
    [JsonIgnore]
    public Utente CreatoDa { get; set; } = null!;

    // ─── Dati paziente ──────────────────────────────────
    public string  NomePaziente           { get; set; } = string.Empty;
    public string  CognomePaziente        { get; set; } = string.Empty;
    public int?    EtaPaziente            { get; set; }
    public string? NumeroTelefonoPaziente { get; set; }
    public string? CodiceFiscalePaziente  { get; set; }

    // ─── Metadati ───────────────────────────────────────
    public List<string> TipiLavorazione    { get; set; } = new();
    public string       Stato              { get; set; } = "in lavorazione";
    public string       SpecificheTecniche { get; set; } = string.Empty;
    public DateTime     DataCreazione      { get; set; } = DateTime.UtcNow;
}
