import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, tap } from 'rxjs/operators';
import { StorageService } from './storage.service';

export interface ConsensoPrivacy {
  privacy: boolean;
  marketing: boolean;
  cookie: boolean;
  termini: boolean;
  gdpr: boolean;
  dataAccettazione?: Date;
  versionePolicy?: string;
  userId?: number;
}

interface ConsensoPrivacyDTO extends ConsensoPrivacy {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivacyConsentService {
  private storageKey = 'privacy_consents';
  private consensoSubject = new BehaviorSubject<ConsensoPrivacy | null>(null);
  readonly currentPolicyVersion = "1.0"; // Definisci la versione attuale delle policy
  
  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.caricaConsensi();
  }

  get consensi$(): Observable<ConsensoPrivacy | null> {
    return this.consensoSubject.asObservable();
  }

  get consensiCorretti(): boolean {
    const consensi = this.consensoSubject.value;
    return !!consensi && consensi.privacy && consensi.termini && consensi.gdpr;
  }

  private caricaConsensi(): void {
    try {
      const savedConsents = localStorage.getItem(this.storageKey);
      if (savedConsents) {
        const consents = JSON.parse(savedConsents) as ConsensoPrivacy;
        this.consensoSubject.next(consents);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei consensi:', error);
      this.consensoSubject.next(null);
    }
  }

  private getConsensoFromStorage(): ConsensoPrivacy | null {
    try {
      const savedConsents = localStorage.getItem(this.storageKey);
      if (savedConsents) {
        return JSON.parse(savedConsents) as ConsensoPrivacy;
      }
    } catch (error) {
      console.error('Errore nel caricamento dei consensi:', error);
    }
    return null;
  }

  private setConsensoInStorage(consensi: ConsensoPrivacy): void {
    localStorage.setItem(this.storageKey, JSON.stringify(consensi));
    this.consensoSubject.next(consensi);
  }

  // Versione migliorata che salva anche su server
  accettaConsensi(consensi: ConsensoPrivacy): Observable<boolean> {
    // Aggiungi data accettazione e versione policy
    consensi.dataAccettazione = new Date();
    consensi.versionePolicy = this.currentPolicyVersion;
    
    // Salva in localStorage
    this.setConsensoInStorage(consensi);
    
    // Salva anche sul server e traccia metadati
    return this.salvaConsensiServer(consensi).pipe(
      tap(() => {
        console.log('Privacy consents saved to server:', consensi);
      }),
      catchError(error => {
        console.error('Error saving privacy consents to server:', error);
        // Anche in caso di errore considerare valida l'operazione lato client
        // Ma schedula un tentativo di reinvio in background
        setTimeout(() => this.ritentaInvioConsensi(consensi), 10000);
        return of(true);
      })
    );
  }

  private salvaConsensiServer(consensi: ConsensoPrivacy): Observable<boolean> {
    const userStr = this.storageService.getItem('utente');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const consentDTO: ConsensoPrivacyDTO = {
      ...consensi,
      userId: user?.id || 0,
      userAgent: navigator.userAgent
    };
    
    return this.http.post<boolean>(`${environment.apiUrl}/privacy-consents`, consentDTO);
  }

  private ritentaInvioConsensi(consensi: ConsensoPrivacy): void {
    console.log('Retrying sending consents to server...');
    this.salvaConsensiServer(consensi).subscribe({
      next: () => console.log('Consents successfully sent on retry'),
      error: err => console.error('Failed to send consents on retry', err)
    });
  }

  salvaConsensi(consensi: ConsensoPrivacy): void {
    // Metodo legacy mantenuto per retrocompatibilità
    // Aggiungi data accettazione e versione
    consensi.dataAccettazione = new Date();
    consensi.versionePolicy = this.currentPolicyVersion;
    
    // Salva in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(consensi));
    
    // Aggiorna il subject
    this.consensoSubject.next(consensi);
    
    // Tenta comunque di salvare sul server se disponibile
    this.salvaConsensiServer(consensi).subscribe({
      next: () => console.log('Consents also saved to server'),
      error: err => console.error('Failed to save consents to server', err)
    });
  }

  resetConsensi(): void {
    localStorage.removeItem(this.storageKey);
    this.consensoSubject.next(null);
  }

  verificaNecessitàConsenso(): boolean {
    const consensoSalvato = this.getConsensoFromStorage();
    
    // Se non ci sono consensi, è necessario mostrarli
    if (!consensoSalvato) {
      console.log('Nessun consenso salvato trovato');
      return true;
    }

    // Verifica che i consensi obbligatori siano stati accettati
    if (!consensoSalvato.privacy || !consensoSalvato.termini || !consensoSalvato.gdpr) {
      console.log('Consensi obbligatori non accettati');
      return true;
    }
    
    // Verifica che la versione della policy sia aggiornata
    if (consensoSalvato.versionePolicy !== this.currentPolicyVersion) {
      console.log('Versione policy cambiata, richiesto nuovo consenso');
      return true;
    }

    // Verifica la data di accettazione (scadenza dopo 1 anno)
    if (consensoSalvato.dataAccettazione) {
      const dataAccettazione = new Date(consensoSalvato.dataAccettazione);
      const oggi = new Date();
      const unAnnoInMilliseconds = 365 * 24 * 60 * 60 * 1000;

      if (oggi.getTime() - dataAccettazione.getTime() > unAnnoInMilliseconds) {
        console.log('Consensi scaduti');
        return true;
      }
    }

    console.log('Tutti i controlli dei consensi superati');
    return false;
  }

  // Nuovi metodi per la gestione dei diritti GDPR
  revocaConsensoOpzionale(tipoConsenso: 'marketing' | 'cookie'): Observable<boolean> {
    const consensi = this.consensoSubject.value;
    if (!consensi) return of(false);
    
    // Non permettere revoca dei consensi obbligatori
    if (tipoConsenso === 'marketing' || tipoConsenso === 'cookie') {
      const consensiAggiornati = { ...consensi };
      consensiAggiornati[tipoConsenso] = false;
      consensiAggiornati.dataAccettazione = new Date(); // Aggiorna data
      
      return this.accettaConsensi(consensiAggiornati);
    }
    
    return of(false);
  }

  richiediEsportazioneDati(userId: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/users/${userId}/data-export`, {
      responseType: 'blob'
    });
  }

  richiediCancellazioneDati(userId: number, motivazione: string): Observable<boolean> {
    return this.http.post<boolean>(`${environment.apiUrl}/users/${userId}/data-deletion-request`, {
      motivazione
    });
  }
}
