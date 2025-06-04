import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Cliente } from '../models/cliente.model';
import { ApiService } from '../services/api.service';
import { FileService } from '../services/file.service'; // Aggiungi l'import
import { Lavorazione } from '../models/lavorazione.model';
import { StorageService } from '../services/storage.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';


@Component({
  selector: 'app-nuova-lavorazione',
  imports: [CommonModule, FormsModule],
  templateUrl: './nuova-lavorazione.component.html',
  styleUrls: ['./nuova-lavorazione.component.scss']
})
export class NuovaLavorazioneComponent implements OnInit {

  clienti: Cliente[] = [];
  clienteSelezionatoId: number | null = null;
  stato: string = 'in lavorazione';
  specificheTecniche: string = '';
  Object: any;
  tipoSelezionato: string = '';
  sottoTipo: string = 'Fissa';
  opzioniSelezionate: string[] = [];
  nomePaziente: string = '';
  cognomePaziente: string = '';
  etaPaziente: number | null = null;
  //numeroTelefonoPaziente: string = '';
  //codiceFiscalePaziente: string = '';
  immagini: File[] = [];
  stlFiles: File[] = [];
  errorMessage: string | null = null; // Aggiungi questa proprietà

  ruolo: string | null = null;
  utente: any = null;


  tipiLavorazione: Record<string, Record<string, string[]>> = {
    Ortodonzia: {
      Fissa: ['Espansore',
      'Arco saldato',
      'Mantenitore di spazio',
      'Barra traspalatale',
      'Fervula di delaire',
      'Struttura su miniviti palatali',
      'Griglia linguale'
    ],
      Mobile: ['E.L.N di Bonnet',
      'Twin block',
      'Placca di Hawley',
      'Placca di Schwartz',
      'Placca di Bionator',
      'Mascherina di contenzione',
      'Mascherina di sbiancamento',
      'Placca Gianelly',
      'Byte Dentale'
    ],
    }
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private storage: StorageService,
    private fileService: FileService // Aggiungi il FileService
  ) {}

  ngOnInit(): void {
    const utente = this.storage.getItem('utente');
    if (utente) {
      const parsed = JSON.parse(utente);
      this.utente = parsed;
      this.ruolo = parsed.ruolo?.toLowerCase(); // <-- AGGIUNTO

      if (this.ruolo === 'admin') {
        this.apiService.getClienti().subscribe(clienti => {
          this.clienti = clienti;
        });
      }

      if (this.ruolo === 'medico') {
        this.clienteSelezionatoId = parsed.id;
      }
    }
  }

  getTipi(): string[] {
    return Object.keys(this.tipiLavorazione);
  }

  getSottoTipi(): string[] {
    if (this.tipoSelezionato && this.tipiLavorazione[this.tipoSelezionato]) {
      return Object.keys(this.tipiLavorazione[this.tipoSelezionato]);
    }
    return [];
  }

  getOpzioni(): string[] {
    if (
      this.tipoSelezionato &&
      this.sottoTipo &&
      this.tipiLavorazione[this.tipoSelezionato] &&
      this.tipiLavorazione[this.tipoSelezionato][this.sottoTipo]
    ) {
      return this.tipiLavorazione[this.tipoSelezionato][this.sottoTipo];
    }
    return [];
  }

  toggleOpzione(opz: string) {
    if (this.opzioniSelezionate.includes(opz)) {
      this.opzioniSelezionate = this.opzioniSelezionate.filter(o => o !== opz);

    } else {
      this.opzioniSelezionate.push(opz);
    }
  }


  onImmaginiChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.immagini = Array.from(input.files);
  }

  onStlChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.stlFiles = Array.from(input.files);
  }

  onFileChange(event: any, tipo: 'immagini' | 'stl') {
    const files = Array.from(event.target.files) as File[];

    // Validazione dei file
    if (tipo === 'immagini') {
      // Verifica che tutti i file siano immagini
      const validFiles = files.filter(file => this.fileService.isImage(file.name));
      if (validFiles.length !== files.length) {
        this.errorMessage = 'Alcuni file selezionati non sono immagini valide';
        return;
      }
      this.immagini = files;
    }

    if (tipo === 'stl') {
      // Verifica che tutti i file siano STL
      const validFiles = files.filter(file => this.fileService.isStl(file.name));
      if (validFiles.length !== files.length) {
        this.errorMessage = 'Alcuni file selezionati non sono file STL validi';
        return;
      }
      // Verifica dimensione massima (es. 10MB)
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        this.errorMessage = 'Alcuni file STL superano la dimensione massima di 10MB';
        return;
      }
      this.stlFiles = files;
    }

    this.errorMessage = null;
  }

  submit() {
    if (!this.tipoSelezionato || !this.sottoTipo) {
      this.errorMessage = 'Seleziona almeno un tipo e un sotto-tipo di lavorazione';
      return;
    }

    const clienteId = this.ruolo === 'admin' ? this.clienteSelezionatoId : this.utente?.id;
    if (!clienteId) {
      this.errorMessage = 'Nessun cliente selezionato';
      return;
    }

    if (!this.nomePaziente || !this.cognomePaziente) {
      this.errorMessage = 'Nome e cognome del paziente sono obbligatori';
      return;
    }

    const formData = new FormData();
    formData.append('clienteId', clienteId.toString());
    formData.append('stato', this.stato);
    formData.append('specificheTecniche', this.specificheTecniche);
    formData.append('nomePaziente', this.nomePaziente);
    formData.append('cognomePaziente', this.cognomePaziente);
    if (this.etaPaziente) formData.append('etaPaziente', this.etaPaziente.toString());
    formData.append('tipiLavorazioneJson', JSON.stringify([this.tipoSelezionato, this.sottoTipo, ...this.opzioniSelezionate]));

    // Immagini
    for (const img of this.immagini) {
      formData.append('immagini', img);
    }

    // STL
    for (const stl of this.stlFiles) {
      formData.append('stlFile', stl);
    }

    // Usa il fileService per l'upload
    this.fileService.uploadFilesForLavorazione(formData)
      .pipe(
        catchError(error => {
          console.error('Errore durante l\'invio della lavorazione: ', error);
          this.errorMessage = error.message || 'Si è verificato un errore durante l\'invio';
          return throwError(() => error);
        })
      )
      .subscribe({
        next: () => {
          const redirect = this.ruolo === 'admin' ? '/lavorazioni' : '/mie-lavorazioni';
          this.router.navigate([redirect]);
        }
      });
  }

}
