import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Cliente } from '../models/cliente.model';
import { ApiService } from '../services/api.service';
import { FileService } from '../services/file.service'; // Aggiungi l'import
import { SharedService } from '../shared.service';
import { Router } from '@angular/router';
import { Lavorazione } from '../models/lavorazione.model';
import { FormsModule } from '@angular/forms';
import { StlViewerComponent } from '../components/stl-viewer.component';
import { FormatDatetimePipe } from '../pipes/format-datetime.pipe';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-cliente-dettaglio',
  standalone: true,
  imports: [CommonModule, FormsModule, StlViewerComponent, FormatDatetimePipe, RouterModule],
  templateUrl: './cliente-dettaglio.component.html',
  styleUrls: ['./cliente-dettaglio.component.scss']
})
export class ClienteDettaglioComponent implements OnInit {
  cliente: Cliente | null = null;
  lavorazioni: Lavorazione[] = [];
  editModes: Map<number, boolean> = new Map();
  utente: any = null;
  datiMedico: any = null;
  clienteCreatoDaMedico: boolean = false;

  // Proprietà per la gestione dei file
  modalImageUrl: string | null = null;
  modalStlUrl: string | null = null; // Aggiungi questa proprietà
  baseApiUrl: string = 'http://localhost:3000/api';

  constructor(
    public route: ActivatedRoute,
    public apiService: ApiService,
    public fileService: FileService, // Aggiungi il FileService
    private router: Router,
    private sharedService: SharedService,

  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    // Leggi l'ID della lavorazione dai parametri di query
    const lavorazioneId = Number(this.route.snapshot.queryParamMap.get('lavorazioneId'));

    this.apiService.getClienteById(id).subscribe({
      next: (res: any) => {
        this.cliente = res;
      },
      error: (err: any) => {
        console.warn("Cliente non trovato, carico dati medico...");
        this.cliente = null;
        this.apiService.getDatiClienteDaUtente(id).subscribe({
          next: (datiMedico) => {
            this.datiMedico = datiMedico;
          },
          error: (error) => console.error('Errore caricamento dati medico', error)
        });
      }
    });

    // Se è stato passato un ID di lavorazione specifico
    if (lavorazioneId) {
      // Carica solo quella lavorazione specifica
      this.apiService.getLavorazioneById(lavorazioneId).subscribe({
        next: (lavorazione) => {
          if (lavorazione) {
            const lavorazioneConEdit = {
              ...lavorazione,
              tipiLavorazioneStringEdit: lavorazione.tipiLavorazione.join(' > ')
            };
            this.lavorazioni = [lavorazioneConEdit];
          }
        },
        error: (err) => {
          console.error('Errore nel caricamento della lavorazione specifica:', err);
          this.lavorazioni = [];
          // Se fallisce, carica tutte le lavorazioni come fallback
          this.caricaTutteLeLavorazioni(id);
        }
      });
    } else {
      // Altrimenti carica tutte le lavorazioni del cliente (comportamento originale)
      this.caricaTutteLeLavorazioni(id);
    }
  }

  // Estrai il caricamento di tutte le lavorazioni in un metodo separato
  private caricaTutteLeLavorazioni(clienteId: number): void {
    this.apiService.getLavorazioniByCliente(clienteId).subscribe({
      next: (lavorazioni) => {
        this.lavorazioni = lavorazioni.map(l => ({
          ...l,
          tipiLavorazioneStringEdit: l.tipiLavorazione.join(' > ')
        }));

        // Ordina le lavorazioni per data di creazione (le più recenti prima)
        this.lavorazioni.sort((a, b) => {
          const dateA = a.dataCreazione ? new Date(a.dataCreazione).getTime() : 0;
          const dateB = b.dataCreazione ? new Date(b.dataCreazione).getTime() : 0;
          return dateB - dateA; // Ordine discendente
        });
      },
      error: (err) => {
        console.error('Errore nel caricamento delle lavorazioni:', err);
        this.lavorazioni = [];
      }
    });
  }

  // Funzione per chiudere la modale
  chiudiModale(): void {
    this.modalImageUrl = null;
  }

  // Funzione per visualizzare il file STL
  visualizzaStl(percorso: string): void {
    // Usa il fileService invece di apiService
    this.modalStlUrl = this.fileService.getStlViewerUrl(percorso);
  }

  // Aggiungi questa funzione per chiudere la modale STL
  chiudiModaleStl(): void {
    this.modalStlUrl = null;
  }

  // Funzione per scaricare un file
  downloadFile(percorso: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    try {
      const fileId = this.fileService.getLavorazioneId(percorso);
      const fileName = this.fileService.getFileName(percorso);
      const isStl = this.fileService.isStl(fileName);

      if (isStl) {
        this.downloadStl(percorso, event);
        return;
      }

      // Download dell'immagine
      this.fileService.downloadImageFile(fileId, fileName).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (err) => {
          console.error('Errore nel download dell\'immagine:', err);
          window.open(this.fileService.getImageViewerUrl(percorso), '_blank');
        }
      });
    } catch (e) {
      console.error('Errore nel parsing dell\'URL:', e);
      window.open(percorso, '_blank');
    }
  }

  // Funzione per il download del file STL
  downloadStl(percorso: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    try {
      const fileId = this.fileService.getLavorazioneId(percorso);
      const fileName = this.fileService.getFileName(percorso);

      this.fileService.downloadStlFile(fileId, fileName).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (err) => {
          console.error('Errore nel download del file STL:', err);
          window.open(this.fileService.getStlViewerUrl(percorso), '_blank');
        }
      });
    } catch (e) {
      console.error('Errore nel parsing dell\'URL STL:', e);
      window.open(percorso, '_blank');
    }
  }

  // Altre funzioni esistenti
  creaClienteDaMedico() {
    if (!this.datiMedico) return;

    const nuovoCliente = {
      nomeDottore: this.datiMedico.nome,
      cognomeDottore: this.datiMedico.cognome,
      email: this.datiMedico.email,
      telefonoCellulare: this.datiMedico.telefonoCellulare,
      codiceFiscale: this.datiMedico.codiceFiscale,
      telefonoFisso: '',
      partitaIva: '',
      nomeStudio: '',
      viaStudio: '',
      cittaStudio: '',
      codiceSDI: '',
      dataCreazione: new Date()
    };

    this.apiService.addCliente(nuovoCliente).subscribe({
      next: (res: any) => {
        console.log('Cliente creato correttamente!');
        this.clienteCreatoDaMedico = true;
        this.router.navigate(['/clienti', res.id]);
      },
      error: (err) => console.error('Errore creazione cliente', err)
    });
  }

  modificaLavorazione(l: Lavorazione) {
    this.editModes.set(l.id!, true);
  }

  salvaLavorazione(l: any) {
    const id = l.id;
    if (id == null) return;

    const tipiArray = l.tipiLavorazioneStringEdit?.split('>').map((t: string) => t.trim()) ?? [];

    const payload: Lavorazione = {
      ...l,
      tipiLavorazione: tipiArray
    };

    this.apiService.updateLavorazione(id, payload).subscribe({
      next: () => {
        l.tipiLavorazione = tipiArray;
        this.editModes.delete(id);
      },
      error: (err) => console.error('Errore durante il salvataggio:', err)
    });
  }

  eliminaLavorazione(id?: number) {
    if (id == null) return;

    if (!confirm('Eliminare questa lavorazione?')) return;

    this.apiService.deleteLavorazione(id).subscribe({
      next: () => {
        this.lavorazioni = this.lavorazioni.filter(l => l.id !== id);
        this.editModes.delete(id);
      },
      error: (err) => console.error('Errore durante l\'eliminazione:', err)
    });
  }

  eliminaCliente() {
    if (!this.cliente) return;

    this.apiService.deleteCliente(this.cliente.id!).subscribe(() => {
      this.sharedService.noticaEliminazioneCliente();
      this.router.navigate(['/clienti']);
    });
  }

  apriImmagine(percorso: string): void {
    this.modalImageUrl = this.fileService.getImageViewerUrl(percorso);
    console.log('URL per visualizzazione immagine:', this.modalImageUrl);
  }
}
