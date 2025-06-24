import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import { Lavorazione } from '../../models/lavorazione.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-nuova-lavorazione-medico',
  imports: [CommonModule, FormsModule],
  templateUrl: './nuova-lavorazione-medico.component.html',
  styleUrl: './nuova-lavorazione-medico.component.scss'
})
export class NuovaLavorazioneMedicoComponent implements OnInit {
  tipoSelezionato: string = '';
  sottoTipo: string = 'Fissa';
  opzioniSelezionate: string[] = [];
  specificheTecniche: string = '';
  nomePaziente: string = '';
  cognomePaziente: string = '';
  etaPaziente: number | null = null;
  numeroTelefonoPaziente: string = '';
  codiceFiscalePaziente: string = '';

  utente: any = null;
  ruolo: string | null = null;
  immagini: File[] = [];
  stlFile: File[] = [];
  loading: boolean = false;

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

  constructor(private apiService: ApiService, private router: Router, private storage: StorageService, private toast: ToastrService) { }

  ngOnInit(): void {
    const utenteStorage = this.storage.getItem('utente');
    if (utenteStorage) {
      const parsed = JSON.parse(utenteStorage);
      this.utente = parsed;
      this.ruolo = parsed.ruolo;
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
    if(
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

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if(input.files) {
      this.immagini = Array.from(input.files);
    }
  }

  onStlSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if(input.files) {
      this.stlFile = Array.from(input.files);
    }
  }



  submit() {
    if (!this.tipoSelezionato || !this.sottoTipo || !this.utente) {
      this.toast.error('Completa tutti i campi obbligatori', 'Errore');
      return;
    }

    // Verifica taglia massima file...

    const formData = new FormData();

    // Assicurati di usare i nomi esatti dei parametri come attesi dal backend
    formData.append('ClienteId', this.utente?.clienteId?.toString() || '0');

    // Se il backend necessita di integer, converte esplicitamente
    if (this.utente?.id) {
      formData.append('CreatoDaUtenteId', this.utente.id.toString());
    }

    formData.append('Stato', 'in lavorazione');
    formData.append('SpecificheTecniche', this.specificheTecniche || '');
    formData.append('NomePaziente', this.nomePaziente || '');
    formData.append('CognomePaziente', this.cognomePaziente || '');

    if (this.etaPaziente) {
      formData.append('EtaPaziente', this.etaPaziente.toString());
    }

    formData.append('NumeroTelefonoPaziente', this.numeroTelefonoPaziente || '');
    formData.append('CodiceFiscalePaziente', this.codiceFiscalePaziente || '');

    const tipiLavorazioneArray = [this.tipoSelezionato, this.sottoTipo, ...this.opzioniSelezionate];

    // Assicurati che corrisponda esattamente al parametro atteso dal backend
    const tipiJson = JSON.stringify(tipiLavorazioneArray);
    formData.append('TipiLavorazioneJson', tipiJson);

    // Aggiungi i file con i nomi esatti attesi dal controller
    if (this.immagini && this.immagini.length > 0) {
      for (let i = 0; i < this.immagini.length; i++) {
        formData.append('Immagini', this.immagini[i], this.immagini[i].name);
      }
    }

    if (this.stlFile && this.stlFile.length > 0) {
      for (let i = 0; i < this.stlFile.length; i++) {
        formData.append('StlFile', this.stlFile[i], this.stlFile[i].name);
      }
    }

    console.log('Invio FormData con endpoint corretto');

    // Log completo per debug
    formData.forEach((value, key) => {
      console.log(`${key}: ${value instanceof File ? `${value.name} (${value.size} bytes)` : value}`);
    });

    this.loading = true;

    this.apiService.addLavorazione(formData).subscribe({
      next: (response) => {
        console.log('Risposta upload:', response);

        // Gestisci sia oggetti che stringhe
        if (response.progress !== undefined) {
          // È un aggiornamento di progresso, non fare niente qui
          return;
        }

        this.toast.success('Lavorazione creata con successo!');
        this.router.navigate(['/mie-lavorazioni']);
      },
      error: (err) => {
        
        this.loading = false;

        // Mostra il messaggio di errore
        let errorMsg = err.message || 'Si è verificato un errore durante il caricamento';
        this.toast.error(errorMsg);
      }
    });
  }
}
