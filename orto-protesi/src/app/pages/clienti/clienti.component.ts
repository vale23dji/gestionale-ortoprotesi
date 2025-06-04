import { SharedService } from './../../shared.service';
import { ApiService } from '../../services/api.service';
import { Component, OnInit } from '@angular/core';
import { Cliente } from '../../models/cliente.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { LavorazioniComponent } from '../lavorazioni/lavorazioni.component';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-clienti',
  imports: [CommonModule, FormsModule, LavorazioniComponent],
  templateUrl: './clienti.component.html',
  styleUrl: './clienti.component.scss'
})
export class ClientiComponent implements OnInit {

  @ViewChild(LavorazioniComponent) lavorazioniComponent!: LavorazioniComponent;
  clienti: Cliente[] = [];
  nuovoCliente: Cliente = {
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
    dataCreazione: new Date()
  };


  filtroPerCliente = '';
  erroreMessagio = '';
  filtroPerTipo = 'tutti';
  clienteInModifica: Cliente | null = null;
  aggiuntaSuccesso = false;
  static clientiAggiornati$ = new Subject<void>();
  loading = false;

  constructor(private apiService: ApiService, private sharedService: SharedService, private toastService: ToastrService) {}

  ngOnInit() {
    this.loadCliente();
  }

  loadCliente() {
    this.apiService.getClienti().subscribe({
      next: (res) => {
        // Verifica che res sia effettivamente un array
        if (!Array.isArray(res)) {
          console.error('La risposta non è un array:', res);
          this.clienti = [];
          return;
        }

        this.clienti = res.sort((a, b) =>
          new Date(a.dataCreazione).getTime() - new Date(b.dataCreazione).getTime()
        );
      },
      error: (err) => console.error('Errore caricamento clienti', err)
    });

  }

  aggiungiCliente() {
    if (!this.nuovoCliente.nomeDottore || !this.nuovoCliente.cognomeDottore || !this.nuovoCliente.email) {
      this.erroreMessagio = "Nome, cognome ed email sono obbligatori";
      setTimeout(() => this.erroreMessagio = '', 4000);
      return;
    }

    // Verifica se l'email esiste già prima di tentare l'inserimento
    this.loading = true;
    this.apiService.verificaEmailEsistente(this.nuovoCliente.email).subscribe({
      next: (esistente) => {
        if (esistente) {
          this.loading = false;
          this.erroreMessagio = `L'email ${this.nuovoCliente.email} è già in uso`;
          this.toastService.error(this.erroreMessagio);
          setTimeout(() => this.erroreMessagio = '', 4000);
        } else {
          // Procedi con l'aggiunta del cliente
          this.apiService.addCliente(this.nuovoCliente).subscribe({
            next: () => {
              this.loading = false;
              this.aggiornaForm();
              this.loadCliente();
              this.aggiuntaSuccesso = true;
              this.toastService.success('Cliente aggiunto con successo');
              setTimeout(() => this.aggiuntaSuccesso = false, 3000);
            },
            error: (err) => {
              this.loading = false;
              this.aggiuntaSuccesso = false;

              let errorMsg = 'Si è verificato un errore durante l\'aggiunta del cliente';
              if (err.error && err.error.includes && err.error.includes('email')) {
                errorMsg = `L'email ${this.nuovoCliente.email} è già in uso`;
              } else if (err.error) {
                errorMsg = err.error;
              }

              this.erroreMessagio = errorMsg;
              this.toastService.error(this.erroreMessagio);
              setTimeout(() => this.erroreMessagio = '', 4000);
            }
          });
        }
      },
      error: () => {
        // Se la verifica fallisce, tenta comunque l'inserimento
        this.loading = false;
        this.procediConAggiuntaCliente();
      }
    });
  }

  // Metodo ausiliario per aggiungere effettivamente il cliente
  private procediConAggiuntaCliente() {
    this.loading = true;
    this.apiService.addCliente(this.nuovoCliente).subscribe({
      next: () => {
        this.loading = false;
        this.aggiornaForm();
        this.loadCliente();
        this.aggiuntaSuccesso = true;
        this.toastService.success('Cliente aggiunto con successo');
        setTimeout(() => this.aggiuntaSuccesso = false, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.aggiuntaSuccesso = false;
        this.erroreMessagio = err.error || "Si è verificato un errore";
        this.toastService.error(this.erroreMessagio);
        setTimeout(() => this.erroreMessagio = '', 4000);
      }
    });
  }

  aggiornaForm() {
    this.nuovoCliente = {
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
      dataCreazione: new Date()
    };
  }

  eliminaCliente(id: number) {
    if (confirm('Sei sicuro di voler eliminare questo cliente? Verranno eliminati anche tutti gli inviti collegati.')) {
      this.loading = true;
      this.apiService.deleteCliente(id).subscribe({
        next: () => {
          this.loading = false;
          this.loadCliente();
          this.sharedService.triggerRefreshLavorazioni(); // Notifica la pagina lavorazioni
          this.erroreMessagio = '';
          this.aggiuntaSuccesso = true;
          this.toastService.success('Cliente eliminato con successo'); // Aggiungi questo
          setTimeout(() => {
            this.aggiuntaSuccesso = false;
          }, 3000);
        },
        error: (err) => {
          this.loading = false;
          console.error('Errore durante eliminazione cliente:', err);
          this.erroreMessagio = err.error || 'Errore durante eliminazione del cliente';
          this.toastService.error(this.erroreMessagio); // Aggiungi questo
          setTimeout(() => this.erroreMessagio = '', 4000);
        }
      });
    }
  }

  modifica(cliente: Cliente) {
    this.clienteInModifica = { ...cliente };
  }

  salvaModifiche() {
    if (!this.clienteInModifica) return;

    this.apiService.updateCliente(this.clienteInModifica).subscribe(() => {
      this.clienteInModifica = null;
      this.loadCliente();
    });
  }

  annullaModifica() {
    this.clienteInModifica = null;
  }

  get clientiFiltrati(): Cliente[] {
    const query = this.filtroPerCliente.trim().toLowerCase();

    return this.clienti.filter(c => {
      switch (this.filtroPerTipo) {
        case 'nome': return c.nomeDottore.toLowerCase().includes(query);
        case 'cognome': return c.cognomeDottore.toLowerCase().includes(query);
        case 'email': return c.email.toLowerCase().includes(query);
        case 'telefono':
          return (
            c.telefonoCellulare?.toLowerCase().includes(query) ||
            c.telefonoFisso?.toLowerCase().includes(query)
          );
        default:
          return (
            `${c.nomeDottore} ${c.cognomeDottore}`.toLowerCase().includes(query) ||
            `${c.cognomeDottore} ${c.nomeDottore}`.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            (c.telefonoCellulare?.toLowerCase().includes(query) ?? false) ||
            (c.telefonoFisso?.toLowerCase().includes(query) ?? false)
          );
      }
    });
  }
}

