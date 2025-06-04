import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FileService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Ottiene il percorso corretto per qualsiasi risorsa (STL, immagini, ecc.)
   * @param url Il percorso originale della risorsa
   * @returns L'URL completo per accedere alla risorsa
   */
  getResourceUrl(url: string): string {
    if (!url) return '';

    // Se l'URL contiene già http, lo restituisce così com'è
    if (url.startsWith('http')) return url;

    // Altrimenti, combina con baseUrl, gestendo anche path con o senza / iniziale
    return `${this.baseUrl}/${url.startsWith('/') ? url.substring(1) : url}`;
  }

  /**
   * Ottiene il percorso per visualizzare un'immagine
   * @param url Il percorso dell'immagine
   * @returns L'URL completo dell'immagine
   */
  getImageViewerUrl(url: string): string {
    return this.getResourceUrl(url);
  }

  /**
   * Ottiene il percorso per visualizzare un file STL
   * @param url Il percorso del file STL
   * @returns L'URL completo del file STL
   */
  getStlViewerUrl(url: string): string {
    return this.getResourceUrl(url);
  }

  /**
   * Ottiene il nome del file da un URL
   * @param url L'URL del file
   * @returns Il nome del file
   */
  getFileName(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Estrae l'ID della lavorazione da un URL
   * @param url L'URL del file
   * @returns L'ID della lavorazione
   */
  getLavorazioneId(url: string): number {
    if (!url) return 0;
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    // Cerca l'ID numerico nel percorso
    for (let i = 0; i < parts.length - 1; i++) {
      const id = parseInt(parts[i]);
      if (!isNaN(id)) return id;
    }
    return 0;
  }

  /**
   * Scarica un file STL
   * @param id ID della lavorazione
   * @param filename Nome del file STL
   * @returns Observable con il blob del file
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
   * Scarica un'immagine
   * @param id ID della lavorazione
   * @param filename Nome del file immagine
   * @returns Observable con il blob dell'immagine
   */
  downloadImageFile(id: number, filename: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/lavorazioni/download-image/${id}/${filename}`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error(`Errore nel download dell'immagine ${filename}:`, error);
        return throwError(() => new Error(`Errore nel download dell'immagine: ${error.statusText || 'Errore sconosciuto'}`));
      })
    );
  }

  /**
   * Download generico con indicatore di progresso
   * @param url URL del file da scaricare
   * @param filename Nome del file (opzionale)
   * @returns Observable con progresso e blob finale
   */
  downloadFileWithProgress(url: string, filename?: string): Observable<{ progress: number, blob?: Blob }> {
    return this.http.get(this.getResourceUrl(url), {
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.DownloadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          return { progress };
        } else if (event.type === HttpEventType.Response) {
          return { progress: 100, blob: event.body as Blob };
        }
        return { progress: 0 };
      }),
      catchError(error => {
        console.error(`Errore nel download del file:`, error);
        return throwError(() => new Error(`Errore nel download del file: ${error.statusText || 'Errore sconosciuto'}`));
      })
    );
  }

  /**
   * Carica uno o più file per una lavorazione (wrapper del metodo api.service)
   * @param formData FormData con i file da caricare
   * @returns Observable con la risposta del server
   */
  uploadFilesForLavorazione(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/lavorazioni/upload`, formData).pipe(
      catchError(error => {
        console.error('Errore durante l\'upload dei file:', error);
        return throwError(() => new Error(`Errore durante l'upload: ${error.statusText || 'Errore sconosciuto'}`));
      })
    );
  }

  /**
   * Determina il tipo MIME di un file in base all'estensione
   * @param filename Nome del file
   * @returns Il tipo MIME
   */
  getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'bmp':
        return 'image/bmp';
      case 'stl':
        return 'application/octet-stream';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Verifica se un file è un'immagine in base all'estensione
   * @param filename Nome del file
   * @returns true se è un'immagine, false altrimenti
   */
  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext);
  }

  /**
   * Verifica se un file è un STL in base all'estensione
   * @param filename Nome del file
   * @returns true se è un STL, false altrimenti
   */
  isStl(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext === 'stl';
  }
}
