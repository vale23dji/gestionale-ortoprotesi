import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { RouterModule } from '@angular/router';
import { FileService } from '../../services/file.service';
import { StlViewerComponent } from '../../components/stl-viewer.component';
import { SharedService } from '../../shared.service';
import { FormatDatetimePipe } from '../../pipes/format-datetime.pipe';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';

// Definizione dell'interfaccia
interface LavorazioneDTO {
  id?: number;
  nomePaziente?: string;
  cognomePaziente?: string;
  etaPaziente?: number;
  tipiLavorazione?: string[];
  stato?: string;
  dataCreazione?: string;
  percorsiFileImmagini?: string[];
  percorsiFileStl?: string[];
  clienteId?: number;
  nomeCompletoCliente?: string;
}

@Component({
  selector: 'app-mie-lavorazioni',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StlViewerComponent, FormatDatetimePipe],
  templateUrl: './mie-lavorazioni.component.html',
  styleUrls: ['./mie-lavorazioni.component.scss']
})
export class MieLavorazioniComponent implements OnInit {
  lavorazioni: LavorazioneDTO[] = [];
  modalImageUrl: string | null = null;
  modalStlUrl: string | null = null;
  isMedico: boolean = false;

  // Proprietà per i messaggi di feedback
  message: string = '';
  messageType: 'success' | 'error' | null = null;

  constructor(
    public apiService: ApiService,
    public fileService: FileService,
    private sharedService: SharedService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verifica se l'utente è un medico
    const userString = this.storageService.getItem('utente');
    if (userString) {
      const user = JSON.parse(userString);
      this.isMedico = user?.ruolo?.toLowerCase() === 'medico';
    }

    this.loadLavorazioni();
  }

  loadLavorazioni(): void {
    console.log('Caricamento lavorazioni...');

    this.apiService.getMieLavorazioni().subscribe({
      next: (res: any) => {
        if (!res || !Array.isArray(res)) {
          console.warn('Risposta API non valida:', res);
          this.lavorazioni = [];
          return;
        }

        // Processa gli URL dei file
        this.lavorazioni = res.map((lav: any) => {
          // Processa le immagini
          if (lav.percorsiFileImmagini && Array.isArray(lav.percorsiFileImmagini)) {
            lav.percorsiFileImmagini = lav.percorsiFileImmagini.map(
              (url: string) => this.fileService.getImageViewerUrl(url)
            );
          } else {
            lav.percorsiFileImmagini = [];
          }

          // Processa i file STL
          if (lav.percorsiFileStl && Array.isArray(lav.percorsiFileStl)) {
            lav.percorsiFileStl = lav.percorsiFileStl.map(
              (url: string) => this.fileService.getStlViewerUrl(url)
            );
          } else {
            lav.percorsiFileStl = [];
          }

          return lav;
        });

        // Ordina le lavorazioni per data di creazione (le più recenti prima)
        this.lavorazioni.sort((a, b) => {
          const dateA = a.dataCreazione ? new Date(a.dataCreazione).getTime() : 0;
          const dateB = b.dataCreazione ? new Date(b.dataCreazione).getTime() : 0;
          return dateB - dateA; // Ordine discendente
        });

        console.log(`Ricevute ${this.lavorazioni.length} lavorazioni`);
      },
      error: error => {
        console.error('Errore caricamento lavorazioni:', error);
        this.message = 'Impossibile caricare le lavorazioni';
        this.messageType = 'error';
      }
    });
  }

  openImageViewer(url: string): void {
    console.log('Apertura immagine:', url);
    this.modalImageUrl = url;
    this.modalStlUrl = null;
  }

  openStlViewer(url: string): void {
    console.log('Apertura STL:', url);
    this.modalStlUrl = this.fileService.getStlViewerUrl(url);
    this.modalImageUrl = null;
    console.log('URL STL elaborato:', this.modalStlUrl);
  }

  closeModal(): void {
    this.modalImageUrl = null;
    this.modalStlUrl = null;
  }

  downloadStl(url: string): void {
    try {
      const id = this.fileService.getLavorazioneId(url);
      const filename = this.fileService.getFileName(url);

      console.log(`Download STL: id=${id}, filename=${filename}`);

      this.fileService.downloadStlFile(id, filename).subscribe({
        next: blob => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = filename;
          link.click();
          window.URL.revokeObjectURL(link.href);
        },
        error: err => {
          console.error('Errore download file:', err);
          this.message = 'Impossibile scaricare il file';
          this.messageType = 'error';
        }
      });
    } catch (e) {
      console.error('Errore nel parsing dell\'URL:', e);
      this.message = 'Impossibile elaborare l\'URL del file';
      this.messageType = 'error';
    }
  }

  getFileName(url: string): string {
    return this.fileService.getFileName(url);
  }

  getStatoBadgeClass(stato: string): string {
    if (!stato) return '';

    const statoLower = stato.toLowerCase().replace(/\s+/g, '-');
    switch (statoLower) {
      case 'in-lavorazione':
      case 'in-corso':
        return 'in-lavorazione';
      case 'completata':
      case 'conclusa':
        return 'completata';
      default:
        return statoLower;
    }
  }

  eliminaLavorazione(id?: number): void {
    if (!id) {
      this.message = 'ID lavorazione non valido';
      this.messageType = 'error';
      return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa lavorazione?')) {
      return;
    }

    this.apiService.deleteLavorazione(id).subscribe({
      next: () => {
        this.lavorazioni = this.lavorazioni.filter(l => l.id !== id);
        this.message = 'Lavorazione eliminata con successo';
        this.messageType = 'success';

        // Notifica altri componenti dell'eliminazione
        this.sharedService.triggerRefreshLavorazioni();
      },
      error: err => {
        console.error('Errore eliminazione lavorazione:', err);
        let errorMsg = 'Errore durante l\'eliminazione';

        if (err.status === 404) {
          errorMsg = 'Lavorazione non trovata';
        } else if (err.status === 403) {
          errorMsg = 'Non hai i permessi per eliminare questa lavorazione';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        this.message = errorMsg;
        this.messageType = 'error';
      }
    });
  }

  // Nuovo metodo per la modifica degli allegati di una lavorazione
  modificaLavorazione(id?: number): void {
    if (!id) {
      this.message = 'ID lavorazione non valido';
      this.messageType = 'error';
      return;
    }

    // Naviga alla pagina di modifica allegati
    this.router.navigate(['/modifica-allegati', id]);
  }
}
