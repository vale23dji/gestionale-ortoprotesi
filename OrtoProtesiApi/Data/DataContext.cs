using Microsoft.EntityFrameworkCore;
using OrtoProtesiApi.Models;

namespace OrtoProtesiApi.Data;

public class DataContext : DbContext
{
    public DataContext(DbContextOptions<DataContext> options) : base(options) {}

    public DbSet<Utente>          Utenti              => Set<Utente>();
    public DbSet<Cliente>         Clienti             => Set<Cliente>();
    public DbSet<Lavorazione>     Lavorazioni         => Set<Lavorazione>();
    public DbSet<EmailVerification> EmailVerifications => Set<EmailVerification>();
    public DbSet<InvitoMedico>    InvitiMedici        => Set<InvitoMedico>();
    protected override void OnModelCreating(ModelBuilder mb)
  {
    base.OnModelCreating(mb);

    // ─── 1-a-1  Utente ⇆ Cliente ──────────────────────────────
    mb.Entity<Utente>()
      .HasOne(u => u.Cliente)
      .WithOne(c => c.Utente)
      .HasForeignKey<Cliente>(c => c.UtenteId)
      .OnDelete(DeleteBehavior.Cascade);

    // ─── 1-a-n  Cliente → Lavorazioni ─────────────────────────
    mb.Entity<Lavorazione>()
      .HasOne(l => l.Cliente)
      .WithMany(c => c.Lavorazioni)
      .HasForeignKey(l => l.ClienteId)
      .OnDelete(DeleteBehavior.Cascade);

    // ─── 1-a-n  Utente (creatore) → Lavorazioni ───────────────
    mb.Entity<Lavorazione>()
      .HasOne<Utente>(l => l.CreatoDa)                 // navigation non necessaria su Utente
      .WithMany()
      .HasForeignKey(l => l.CreatoDaUtenteId)
      .OnDelete(DeleteBehavior.Restrict);

    // ─── enum salvato come stringa ----------------------------
    mb.Entity<Utente>()
      .Property(u => u.Ruolo)
      .HasConversion<string>();
  }
}
