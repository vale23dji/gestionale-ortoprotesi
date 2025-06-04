using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace OrtoProtesiApi.DTOs
{
    public class LavorazioneFormDTO
    {
        public int? ClienteId { get; set; }
        public string Stato { get; set; } = "";
        public string SpecificheTecniche { get; set; } = "";
        public string NomePaziente { get; set; } = "";
        public string CognomePaziente { get; set; } = "";
        public int? EtaPaziente { get; set; }
        public string? NumeroTelefonoPaziente { get; set; } = "";
        public string CodiceFiscalePaziente { get; set; } = "";

        // qui abbiamo l’array di tipi
        public string TipiLavorazioneJson { get; set; } = "";

        // IFormFile per upload
        public IFormFileCollection Immagini { get; set; } = new FormFileCollection();
        public IFormFileCollection StlFile { get; set; } = new FormFileCollection();
    }
}


