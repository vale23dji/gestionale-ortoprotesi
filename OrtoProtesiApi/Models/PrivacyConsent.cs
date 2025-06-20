using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OrtoProtesiApi.Models
{
    public class PrivacyConsent
    {
        public int Id { get; set; }
        
        [Required]
        public int UtenteId { get; set; }
        
        [Required]
        public bool Privacy { get; set; }
        
        public bool Marketing { get; set; }
        
        public bool Cookie { get; set; }
        
        [Required]
        public bool Termini { get; set; }
        
        [Required]
        public bool Gdpr { get; set; }
        
        [Required]
        public DateTime DataAccettazione { get; set; }
        
        [Required]
        [MaxLength(10)]
        public string VersionePolicy { get; set; }
        
        [MaxLength(45)]
        public string IPAddress { get; set; }
        
        [MaxLength(500)]
        public string UserAgent { get; set; }
        
        [ForeignKey("UtenteId")]
        public virtual Utente Utente { get; set; }
    }
}