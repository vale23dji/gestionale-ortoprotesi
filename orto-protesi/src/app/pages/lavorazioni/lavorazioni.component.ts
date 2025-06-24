import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FileService } from '../../services/file.service';
import { SharedService } from '../../shared.service';
import { StorageService } from '../../services/storage.service';
import { LavorazioneDTO } from '../../models/LavorazioneDTO';
import { FilterBySottoTipoPipe } from '../../pipes/filter-by-sotto-tipo.pipe';
import { FormatDatetimePipe } from '../../pipes/format-datetime.pipe';

@Component({
  selector: 'app-lavorazioni',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FilterBySottoTipoPipe,
    RouterModule,
    FormatDatetimePipe
  ],
  templateUrl: './lavorazioni.component.html',
  styleUrls: ['./lavorazioni.component.scss']
})
export class LavorazioniComponent implements OnInit {
  lavorazioni: LavorazioneDTO[] = [];
  // Non useremo più lavorazioniPerCliente
  editModes: Map<number, boolean> = new Map();
  ruolo: string | null = null;
  errorMessage: string | null = null;

  // Proprietà per il dettaglio cliente
  clienteSelezionato: any | null = null;
  lavorazioniClienteSelezionato: LavorazioneDTO[] = [];

  constructor(
    private apiService: ApiService,
    private sharedService: SharedService,
    private storage: StorageService,
    public fileService: FileService
  ) {}

  ngOnInit(): void {
    const utenteString = this.storage.getItem('utente');
    if (!utenteString) return;

    const utente = JSON.parse(utenteString);
    this.ruolo = utente.ruolo?.toLowerCase();
    const utenteId = utente.id;

    if (this.ruolo === 'admin') {
      this.caricaTutteLeLavorazioni();
    } else {
      this.caricaLavorazioniPerUtente(utenteId);
    }
  }

  caricaTutteLeLavorazioni(): void {
    this.apiService.getLavorazioni().subscribe({
      next: res => {
        // Verifica che res sia un array valido
        if (!res || !Array.isArray(res)) {
          console.error('La risposta non è un array valido:', res);
          this.lavorazioni = [];
          return;
        }

        // Processa gli URL dei file
        this.lavorazioni = res.map(lav => {
          if (lav.percorsiFileImmagini && Array.isArray(lav.percorsiFileImmagini)) {
            lav.percorsiFileImmagini = lav.percorsiFileImmagini.map(
              url => this.fileService.getImageViewerUrl(url)
            );
          }

          if (lav.percorsiFileStl && Array.isArray(lav.percorsiFileStl)) {
            lav.percorsiFileStl = lav.percorsiFileStl.map(
              url => this.fileService.getStlViewerUrl(url)
            );
          }

          // Aggiungiamo i dati del cliente se presenti
          if (lav.clienteId && !lav.nomeCompletoCliente) {
            // Qui potresti fare una chiamata API per ottenere i dettagli del cliente
            // o usare informazioni già presenti nella risposta
            lav.nomeCompletoCliente = lav.nomeCompletoCliente || 'Cliente #' + lav.clienteId;
          }

          return lav;
        });

        // Ordina le lavorazioni per data di creazione (le più recenti prima)
        this.lavorazioni.sort((a, b) => {
          const dateA = a.dataCreazione ? new Date(a.dataCreazione).getTime() : 0;
          const dateB = b.dataCreazione ? new Date(b.dataCreazione).getTime() : 0;
          return dateB - dateA; // Ordine discendente
        });
      },
      error: err => {
        console.error('Errore loading', err);
        this.errorMessage = 'Impossibile caricare le lavorazioni';
        this.lavorazioni = [];
      }
    });
  }

  caricaLavorazioniPerUtente(clienteId: number): void {
    this.apiService.getMieLavorazioni().subscribe({
      next: (res) => {
        const utente = JSON.parse(this.storage.getItem('utente') || '{}');
        const nomeCompletoCliente = `${utente.nome || ''} ${utente.cognome || ''}`;

        this.lavorazioni = res.map(l => {
          // Processa gli URL delle immagini e degli STL
          if (l.percorsiFileImmagini && Array.isArray(l.percorsiFileImmagini)) {
            l.percorsiFileImmagini = l.percorsiFileImmagini.map(
              url => this.fileService.getImageViewerUrl(url)
            );
          }

          if (l.percorsiFileStl && Array.isArray(l.percorsiFileStl)) {
            l.percorsiFileStl = l.percorsiFileStl.map(
              url => this.fileService.getStlViewerUrl(url)
            );
          }

          return {
            id: l.id ?? 0,
            clienteId: l.clienteId,
            nomePaziente: l.nomePaziente,
            cognomePaziente: l.cognomePaziente,
            etaPaziente: l.etaPaziente,
            nomeCompletoCliente: nomeCompletoCliente,
            tipiLavorazione: l.tipiLavorazione,
            stato: l.stato,
            specificheTecniche: l.specificheTecniche,
            dataCreazione: l.dataCreazione ?? new Date(),
            percorsiFileImmagini: l.percorsiFileImmagini,
            percorsiFileStl: l.percorsiFileStl
          };
        });

        // Ordina le lavorazioni (le più recenti prima)
        this.lavorazioni.sort((a, b) => {
          const dateA = a.dataCreazione ? new Date(a.dataCreazione).getTime() : 0;
          const dateB = b.dataCreazione ? new Date(b.dataCreazione).getTime() : 0;
          return dateB - dateA; // Ordine discendente
        });
      },
      error: (err) => {
        console.error('Errore nel caricamento delle lavorazioni per utente: ', err);
        this.errorMessage = 'Impossibile caricare le lavorazioni';
      }
    });
  }

  visualizzaLavorazioniCliente(lavorazione: LavorazioneDTO): void {
    // Mostra solo la lavorazione selezionata
    this.lavorazioniClienteSelezionato = [lavorazione];

    // Imposta il cliente selezionato con info aggiuntive sulla lavorazione
    this.clienteSelezionato = {
      clienteId: lavorazione.clienteId,
      nomeCompletoCliente: lavorazione.nomeCompletoCliente || 'Cliente #' + lavorazione.clienteId,
      lavorazioneId: lavorazione.id,
      nomePaziente: lavorazione.nomePaziente,
      cognomePaziente: lavorazione.cognomePaziente
    };

    console.log(`Visualizzazione dettaglio lavorazione ID ${lavorazione.id}`);
  }

  chiudiDettaglio(): void {
    this.clienteSelezionato = null;
    this.lavorazioniClienteSelezionato = [];
  }

  // Il resto dei metodi rimane invariato
  eliminaLavorazione(id: number): void {
    if (id <= 0) {
      this.errorMessage = "ID lavorazione non valido";
      return;
    }

    if (!confirm('Confermi l\'eliminazione della lavorazione?')) return;
    this.apiService.deleteLavorazione(id).subscribe({
      next: () => {
        // Aggiorniamo entrambe le liste
        this.lavorazioni = this.lavorazioni.filter(l => l.id !== id);
        this.lavorazioniClienteSelezionato = this.lavorazioniClienteSelezionato.filter(l => l.id !== id);

        // Ricalcoliamo il raggruppamento
        // this.lavorazioniPerCliente = this.raggruppaPerCliente(this.lavorazioni);

        // Se la lista del cliente è vuota, chiudiamo il dettaglio
        if (this.lavorazioniClienteSelezionato.length === 0) {
          this.chiudiDettaglio();
        }

        this.errorMessage = null;
      },
      error: (err) => {
        // Messaggio di errore più descrittivo
        let messaggio = "Errore nell'eliminazione della lavorazione.";

        if (err.error && err.error.message) {
          messaggio += ` ${err.error.message}`;
        } else if (err.status === 404) {
          messaggio = "Lavorazione non trovata. Potrebbe essere già stata eliminata.";
        } else if (err.status === 403) {
          messaggio = "Non hai i permessi necessari per eliminare questa lavorazione.";
        }

        this.errorMessage = messaggio;
      }
    });
  }

  visualizzaImmagine(url: string): void {
    window.open(url, '_blank');
  }

  visualizzaStl(url: string): void {
    // Apre una finestra modale o reindirizza a una pagina di visualizzazione STL
    this.sharedService.openStlViewer(url);
  }

  downloadFile(url: string): void {
    try {
      const fileId = this.fileService.getLavorazioneId(url);
      const fileName = this.fileService.getFileName(url);

      if (this.fileService.isStl(fileName)) {
        this.fileService.downloadStlFile(fileId, fileName).subscribe({
          next: (blob) => this.saveBlob(blob, fileName),
          error: (err) => console.error('Errore nel download del file STL:', err)
        });
      } else {
        this.fileService.downloadImageFile(fileId, fileName).subscribe({
          next: (blob) => this.saveBlob(blob, fileName),
          error: (err) => console.error('Errore nel download dell\'immagine:', err)
        });
      }
    } catch (e) {
      console.error('Errore nell\'elaborazione dell\'URL:', e);
    }
  }

  private saveBlob(blob: Blob, filename: string): void {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
