using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrtoProtesiApi.Models
{
    public class DataDeletionRequest
    {
        public int Id { get; set; }
        
        [Required]
        public int UtenteId { get; set; }
        
        public string Motivazione { get; set; }
        
        [Required]
        public DateTime DataRichiesta { get; set; }
        
        public DateTime? DataCompletamento { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string StatoRichiesta { get; set; } // "In attesa", "Completata", "Rifiutata"
        
        public string NoteAmministrative { get; set; }
        
        [ForeignKey("UtenteId")]
        public virtual Utente Utente { get; set; }
    }
}