import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FileService } from './services/file.service';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private refreshLavorazioniSubject = new Subject<void>();
  private clienteEliminatoSource = new Subject<void>();
  private stlViewerSubject = new Subject<string>();

  stlViewer$ = this.stlViewerSubject.asObservable();

  constructor(private fileService: FileService) { }

  //Observable che può essere ascoltato da altri componenti
  refreshLavorazioni$ = this.refreshLavorazioniSubject.asObservable();
  clienteEliminato$ = this.clienteEliminatoSource.asObservable();


  // Metodo da chiamare per notificare il refresh
  triggerRefreshLavorazioni() {
    this.refreshLavorazioniSubject.next();
  }

  noticaEliminazioneCliente() {
    this.clienteEliminatoSource.next();
  }

  openStlViewer(url: string): void {
    const formattedUrl = this.fileService.getStlViewerUrl(url);
    this.stlViewerSubject.next(formattedUrl);
  }
}
