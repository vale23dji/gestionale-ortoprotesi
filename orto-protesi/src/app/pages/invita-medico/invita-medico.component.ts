// invita-medico.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invita-medico',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invita-medico.component.html',
  styleUrls: ['./invita-medico.component.scss']
})
export class InvitaMedicoComponent {
  medico = {
    nomeDottore: '',
    cognomeDottore: '',
    email: '',
    telefonoCellulare: '',
    telefonoFisso: '',
    codiceFiscale: '',
    partitaIva: '',
    nomeStudio: '',
    viaStudio: '',
    cittaStudio: '',
    codiceSDI: '',
    passwordTemporanea: ''
  };

  loading = false;
  errore: string = '';
  successo: boolean = false;
  credenziali: { email: string, password: string } | null = null;

  constructor(
    private api: ApiService,
    private toast: ToastrService,
    private router: Router
  ) {}

  invita() {
    if (!this.medico.nomeDottore || !this.medico.cognomeDottore || !this.medico.email) {
      this.errore = 'Nome, cognome ed email sono obbligatori';
      this.toast.error(this.errore);
      return;
    }

    this.loading = true;

    // Verifica prima se l'email esiste già
    this.api.verificaEmailEsistente(this.medico.email).subscribe({
      next: (esistente) => {
        if (esistente) {
          this.loading = false;
          this.errore = `L'email ${this.medico.email} è già in uso`;
          this.toast.error(this.errore);
        } else {
          this.procediConInvito();
        }
      },
      error: () => {
        // Se la verifica fallisce, procedi comunque con l'invito
        this.loading = false;
        this.procediConInvito();
      }
    });
  }

  private procediConInvito() {
    this.loading = true;
    this.api.invitaMedico(this.medico).subscribe({
      next: (res) => {
        this.loading = false;
        this.toast.success('Medico invitato con successo');
        this.successo = true;
        this.errore = '';
        this.credenziali = {
          email: this.medico.email,
          password: res.passwordTemporanea
        };
        setTimeout(() => this.router.navigate(['/clienti']), 2000);
      },
      error: (err: any) => {
        this.loading = false;
        let errorMsg = 'Errore durante l\'invito';

        if (err.error && typeof err.error === 'string') {
          if (err.error.toLowerCase().includes('email')) {
            errorMsg = `L'email ${this.medico.email} è già in uso`;
          } else {
            errorMsg = err.error;
          }
        }

        this.errore = errorMsg;
        this.toast.error(this.errore);
      }
    });
  }
}

