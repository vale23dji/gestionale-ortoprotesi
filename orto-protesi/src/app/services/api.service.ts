import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { environment } from '../../environments/environment';
import { Lavorazione } from '../models/lavorazione.model';
import { LavorazioneDTO } from '../models/LavorazioneDTO';
import { tap, catchError, map} from 'rxjs';
import { FileService } from './file.service';


@Injectable({ providedIn: 'root' })
export class ApiService {

  private baseUrl = environment.apiUrl;               // es. http://localhost:5233/api

  constructor(private http: HttpClient, private fileService: FileService) {
    // Se vuoi loggare tutte le risposte, usa un Interceptor oppure logga nei singoli metodi
  }

  // Metodo di utilità per loggare le risposte GET (opzionale)
  private logGetResponse<T>(observable: Observable<T>, url: string): Observable<T> {
    return observable.pipe(
      tap(response => {
        console.log(`GET ${url} response:`, response);
        console.log('Response type:', Array.isArray(response) ? 'Array' : typeof response);
      })
    );
  }

  // Aggiungi questo metodo alla classe ApiService
  private extractArrayFromDotNetResponse<T>(response: any): T[] {
    // Estrae array da risposta .NET con riferimenti
    if (response && response.$values) {
      return response.$values;
    }
    else if (response && typeof response === 'object' && response.$id && response.$values) {
      return response.$values;
    }
    else if (Array.isArray(response)) {
      return response;
    }
    console.warn('Formato risposta non riconosciuto:', response);
    return [];
  }

  /* ───────────── CLIENTI ───────────── */
  getClienti(): Observable<Cliente[]> {
    const url = `${this.baseUrl}/clienti`;
    return this.logGetResponse(
      this.http.get<any>(url)
        .pipe(
          map(response => this.extractArrayFromDotNetResponse<Cliente>(response)),
          catchError(error => {
            console.error('Errore in getClienti:', error);
            return of([]);
          })
        ),
      url
    );
  }

  addCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}/clienti`, cliente);
  }

  updateCliente(cliente: Cliente): Observable<any> {
    return this.http.put(`${this.baseUrl}/clienti/${cliente.id}`, cliente);
  }

  getClienteById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/clienti/dettaglio/${id}`);
  }

  getDatiClienteDaUtente(utenteId: number) {
    return this.http.get<any>(`${this.baseUrl}/clienti/from-utente/${utenteId}`);
  }

  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clienti/${id}`)
      .pipe(
        tap(() => console.log(`Cliente ${id} eliminato con successo`)),
        catchError(error => {
          console.error(`Errore durante l'eliminazione del cliente ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  // aggiungi questo metodo in api.service.ts
  invitaMedico(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/clienti/invita-medico`, data);
  }

  /**
   * Verifica se un'email è già in uso da un cliente o utente
   * @param email Email da verificare
   * @returns Observable che emette true se l'email è già in uso, false altrimenti
   */
  verificaEmailEsistente(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/clienti/verifica-email/${encodeURIComponent(email)}`)
      .pipe(
        tap(risultato => {
          console.log(`Verifica email ${email}: ${risultato ? 'esistente' : 'non esistente'}`);
        }),
        catchError(error => {
          console.error('Errore nella verifica email:', error);
          return of(false); // In caso di errore, assumiamo che l'email non esista
        })
      );
  }

  /**
   * Elimina un invito medico
   * @param id ID dell'invito da eliminare
   * @returns Observable con risposta di eliminazione
   */
  deleteInvitoMedico(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/clienti/inviti/${id}`)
      .pipe(
        tap(() => console.log(`Invito medico ${id} eliminato con successo`)),
        catchError(error => {
          console.error(`Errore durante l'eliminazione dell'invito medico ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Ottiene la lista degli inviti medici
   * @returns Observable con la lista degli inviti
   */
  getListaInviti(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/clienti/lista-inviti`)
      .pipe(
        map(response => {
          // Gestisci diversi formati di risposta possibili
          if (Array.isArray(response)) {
            return response;
          } else if (response && response.$values) {
            return response.$values;
          } else {
            console.warn('Formato risposta imprevisto:', response);
            return [];
          }
        }),
        catchError(error => {
          console.error('Errore nel recupero lista inviti:', error);
          return of([]);
        })
      );
  }

  /* ───────────── LAVORAZIONI ───────────── */
  getLavorazioni(): Observable<LavorazioneDTO[]> {
    return this.http.get<any>(`${this.baseUrl}/lavorazioni`)
      .pipe(
        tap(response => console.log('Risposta originale getLavorazioni:', response)),
        map(response => {
          // Estrai i valori dal formato specifico di .NET
          if (response && response.$values) {
            return response.$values;
          }
          // Se l'oggetto ha la struttura con $id e contiene un array $values
          else if (response && typeof response === 'object' && response.$id && response.$values) {
            return response.$values;
          }
          // Se è già un array, usalo direttamente
          else if (Array.isArray(response)) {
            return response;
          }
          // Fallback: ritorna array vuoto
          console.warn('Formato risposta non riconosciuto:', response);
          return [];
        }),
        catchError(error => {
          console.error('Errore in getLavorazioni:', error);
          return of([]);
        })
      );
  }

  addLavorazione(formData: FormData): Observable<any> {
    console.log('ApiService: Invio richiesta addLavorazione');

    // Log dei contenuti del FormData
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: File ${value.name} (${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });

    // Usa l'endpoint corretto
    const url = `${this.baseUrl}/lavorazioni/upload`;

    return this.http.post(url, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'text' // <-- Modificato per accettare risposte di testo
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          console.log(`Upload in corso: ${percentDone}%`);
          return { progress: percentDone };
        } else if (event.type === HttpEventType.Response) {
          // Prova a interpretare come JSON, ma gestisci anche le risposte di testo
          try {
            const body = event.body ? JSON.parse(event.body) : {};
            console.log('Upload completato con successo:', body);
            return body;
          } catch (e) {
            console.log('Risposta non-JSON ricevuta:', event.body);
            return { message: event.body, success: event.ok };
          }
        }
        return event;
      }),
      catchError(error => {
        console.error('Errore durante l\'upload:', error);

        let errorMessage = 'Si è verificato un errore durante l\'upload dei file';
        let errorDetails = null;

        // Gestisci vari tipi di errori
        if (error.error instanceof ErrorEvent) {
          // Errore client-side
          errorMessage = error.error.message;
        } else {
          // Errore server-side
          console.error(`Codice errore: ${error.status}, Messaggio: ${error.statusText}`);

          // Tentativo di interpretare il corpo dell'errore
          if (typeof error.error === 'string') {
            try {
              // Prova a fare il parsing del JSON
              errorDetails = JSON.parse(error.error);
              errorMessage = errorDetails.message || errorMessage;
            } catch (e) {
              // Se non è JSON, usa il testo direttamente
              console.error('Corpo risposta:', error.error);
              errorMessage = error.error || errorMessage;
            }
          } else if (error.error) {
            // L'errore è già un oggetto
            errorDetails = error.error;
            errorMessage = error.error.message || errorMessage;
          }
        }

        return throwError(() => ({
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          error: errorDetails
        }));
      })
    );
  }

  getLavorazioneById(id: number) {
    return this.http.get<Lavorazione>(`${this.baseUrl}/lavorazioni/${id}`);
  }

  getLavorazioniByCliente(clienteId: number): Observable<Lavorazione[]> {
    return this.http.get<any>(`${this.baseUrl}/lavorazioni/bycliente/${clienteId}`)
      .pipe(
        map(response => {
          // Estrai i valori dal formato specifico di .NET
          if (response && response.$values) {
            return response.$values;
          }
          else if (response && typeof response === 'object' && response.$id && response.$values) {
            return response.$values;
          }
          else if (Array.isArray(response)) {
            return response;
          }
          console.warn('Formato risposta non riconosciuto in getLavorazioniByCliente:', response);
          return [];
        }),
        catchError(error => {
          console.error('Errore in getLavorazioniByCliente:', error);
          return of([]);
        })
      );
  }

  getMieLavorazioni(): Observable<LavorazioneDTO[]> {
    return this.http.get<any>(`${this.baseUrl}/lavorazioni/mie-lavorazioni`)
      .pipe(
        tap(res => {
          console.log('Dati grezzi ricevuti da getMieLavorazioni:', res);

          // Estrai i dati dal formato .NET se necessario
          const data = res && res.$values ? res.$values :
                      (res && typeof res === 'object' && res.$id && res.$values) ? res.$values :
                      (Array.isArray(res) ? res : []);

          // Verifica la struttura dei dati
          if (data.length > 0) {
            console.log('Esempio primo elemento:', data[0]);
            const hasImages = data[0].percorsiFileImmagini && data[0].percorsiFileImmagini.length > 0;
            const hasStl = data[0].percorsiFileStl && data[0].percorsiFileStl.length > 0;
            console.log('Contiene immagini:', hasImages);
            console.log('Contiene STL:', hasStl);
          }
        }),
        map(response => {
          if (response && response.$values) {
            return response.$values;
          }
          else if (response && typeof response === 'object' && response.$id && response.$values) {
            return response.$values;
          }
          else if (Array.isArray(response)) {
            return response;
          }
          console.warn('Formato risposta non riconosciuto in getMieLavorazioni:', response);
          return [];
        }),
        catchError(error => {
          console.error('Errore in getMieLavorazioni:', error);
          return throwError(() => error);
        })
      );
  }

  updateLavorazione(id: number, lavorazione: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/lavorazioni/${id}`, lavorazione);
  }

  deleteLavorazione(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/lavorazioni/${id}`);
  }

  /**
   * Scarica un file STL
   * @param id ID della lavorazione
   * @param filename Nome del file STL
   * @returns Osservabile con il contenuto del file
   */
  downloadStlFile(id: number, filename: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/lavorazioni/download-stl/${id}/${filename}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error(`Errore nel download del file STL ${filename}:`, error);
        if (error.status === 404) {
          return throwError(() => new Error(`Il file ${filename} non è stato trovato sul server`));
        }
        return throwError(() => new Error(`Errore nel download del file: ${error.statusText || 'Errore sconosciuto'}`));
      })
    );
  }

  /**
   * Ottiene l'URL per visualizzare un file STL
   * @param stlPath Percorso del file STL
   * @returns URL per l'API di download
   */
  getStlViewerUrl(url: string): string {
    return this.fileService.getStlViewerUrl(url);
  }

  /**
 * Scarica un'immagine
 * @param id ID della lavorazione
 * @param filename Nome del file immagine
 * @returns Osservabile con il contenuto dell'immagine
 */
downloadImageFile(id: number, filename: string): Observable<Blob> {
  return this.fileService.downloadImageFile(id, filename)
}

/**
 * Ottiene l'URL corretto per visualizzare un'immagine
 * @param imagePath Percorso dell'immagine
 * @returns URL per l'API di download
 */
getImageViewerUrl(url: string): string {
  return this.fileService.getImageViewerUrl(url);
}


/**
 * Gestisce correttamente gli URL di file
 * @param filePath Percorso del file (immagine o STL)
 * @returns URL corretto per il file
 */
getFileUrl(filePath: string): string {
  // Determina se è un file STL o un'immagine
  const isStl = filePath.toLowerCase().endsWith('.stl');
  return isStl ? this.getStlViewerUrl(filePath) : this.getImageViewerUrl(filePath);
}

// Metodo di utilità unificato per gestire tutti i tipi di URL
getResourceUrl(url: string): string {
  if (!url) return '';

  // Se l'URL contiene già http, lo restituisce così com'è
  if (url.startsWith('http')) return url;

  // Altrimenti, combina con baseUrl, gestendo anche path con o senza / iniziale
  return `${this.baseUrl}/${url.startsWith('/') ? url.substring(1) : url}`;
}
}
