import { Component, OnInit } from '@angular/core';
import { InvitoMedico } from '../../models/invitoMedico.model';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-invita-medico-list',
  imports: [CommonModule],
  templateUrl: './invita-medico-list.component.html',
  styleUrls: ['./invita-medico-list.component.scss']
})
export class InvitaMedicoListComponent implements OnInit {

  inviti: InvitoMedico[] = [];
  loading = false;
  errore: string = '';
  eliminazioneInCorso: boolean = false;
  idInEliminazione: number | null = null;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.caricaInviti();
  }

  caricaInviti(): void {
    this.loading = true;
    this.apiService.getListaInviti().subscribe({
      next: (data) => {
        this.inviti = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore caricamento inviti:', error);
        this.errore = 'Errore durante il caricamento degli inviti';
        this.loading = false;
        this.toastr.error(this.errore);
      }
    });
  }

  /**
   * Elimina un invito medico
   * @param id ID dell'invito da eliminare
   * @param email Email del medico per conferma
   */
  eliminaInvito(id: number, email: string): void {
    if (confirm(`Sei sicuro di voler eliminare l'invito per ${email}?`)) {
      this.eliminazioneInCorso = true;
      this.idInEliminazione = id;

      this.apiService.deleteInvitoMedico(id).subscribe({
        next: () => {
          this.toastr.success(`Invito per ${email} eliminato con successo`);
          this.caricaInviti(); // Ricarica la lista
          this.eliminazioneInCorso = false;
          this.idInEliminazione = null;
        },
        error: (err) => {
          const errorMsg = err.error || 'Errore durante l\'eliminazione dell\'invito';
          this.toastr.error(errorMsg);
          this.eliminazioneInCorso = false;
          this.idInEliminazione = null;
        }
      });
    }
  }
}
