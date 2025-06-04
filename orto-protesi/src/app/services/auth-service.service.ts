import { Injectable, Inject, Optional, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import { LoginResponse } from '../pages/login/login.component';
import { isPlatformBrowser } from '@angular/common';

// Interfaccia utente condivisa
export interface Utente {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  ruolo: string;
  id?: number; // opzionale
}

@Injectable({
  providedIn: 'root',
})
export class AuthServiceService {
  private apiUrl = `${environment.apiUrl}/auth`; // cambia porta se diversa
  private _authChanged = new BehaviorSubject<boolean>(false);

  private remember: boolean = true; // Default a true (usa localStorage)

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    @Optional() @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('==== AUTH SERVICE INIT ====');

    // Controlla inizialmente se l'utente è già loggato
    const isLoggedIn = this.isLogged();
    this._authChanged.next(isLoggedIn);
    console.log('- Initial auth state:', isLoggedIn ? 'logged in' : 'not logged in');

    // Controlla se siamo in un browser
    const isBrowser = isPlatformBrowser(this.platformId);
    console.log('- Is browser environment:', isBrowser);

    // Carica la preferenza "ricordami" salvata
    if (isBrowser) {
      try {
        const savedPref = localStorage.getItem('remember_user');
        this.remember = savedPref !== null ? savedPref === 'true' : true;
        console.log('- Loaded remember preference:', this.remember);
      } catch (e) {
        console.error('- Error loading remember preference:', e);
      }
    }
  }

  get authState$(): Observable<boolean> {
    return this._authChanged.asObservable();
  }

  setRemember(value: boolean): void {
    console.log('==== SET REMEMBER ====');
    console.log('- Previous value:', this.remember);
    console.log('- New value:', value);
    this.remember = value;
    this.storage.setPersistence(value);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    console.log('==== LOGIN ATTEMPT ====');

    const payload = {
      Email: email,
      Password: password
    };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, payload)
      .pipe(
        tap({
          next: (res) => {
            console.log('==== LOGIN SUCCESS ====');
            console.log('- Response:', res);

            this.storage.setPersistence(this.remember);

            // Salva i dati dell'utente
            if (res && res.token) {
              this.storage.setItem('token', res.token);
              if (res.utente) {
                this.storage.setItem('utente', JSON.stringify(res.utente));
                const ruolo = res.utente.ruolo?.toLowerCase() || '';
                this.storage.setItem('ruolo', ruolo);
                console.log('- Ruolo salvato:', ruolo);
              }

              // Aggiorna lo stato di autenticazione
              console.log('- Notifying auth state change to: true');
              this._authChanged.next(true);
            }
          },
          error: (err) => {
            console.error('==== LOGIN ERROR ====');
            console.error('- Error details:', err);
          }
        })
      );
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/resend-verification-email?email=${encodeURIComponent(
        email
      )}`,
      {
        responseType: 'text',
      }
    );
  }

  private authStateSubject = new Subject<void>();

  notifyAuthChange() {
    this.authStateSubject.next();
  }

  register(utente: Utente): Observable<any> {
    console.log('Invio utente al backend', utente); // DEBUG

    return this.http.post(`${this.apiUrl}/register`, utente).pipe(
      tap({
        next: (res) => console.log('Risposta ricevuta:', res), // DEBUG
        error: (err) => console.error('Errore dalla chiamata HTTP', err), // DEBUG
      })
    );
  }

  isLogged(): boolean {
    const token = this.storage.getItem('token');
    const utente = this.storage.getItem('utente');
    const isLoggedIn = !!token && !!utente;
    console.log(`==== CHECKING LOGIN STATUS ====`);
    console.log(`- Token exists: ${!!token}`);
    console.log(`- User data exists: ${!!utente}`);
    console.log(`- Is logged in: ${isLoggedIn}`);
    return isLoggedIn;
  }

  logout(): void {
    console.log('==== LOGOUT ====');
    this.storage.removeItem('token');
    this.storage.removeItem('utente');
    this.storage.removeItem('ruolo');
    console.log('- Notifying auth state change to: false');
    this._authChanged.next(false);
  }

  getRememberPreference(): boolean {
    console.log('- Getting remember preference:', this.remember);
    return this.remember;
  }

  //Vacchio metodo originale
  /*getUtente(): Utente | null {
    const user = this.storage.getItem('utente');
    return user ? JSON.parse(user) : null;
  }*/

  getUtente(): Utente | null {
    console.log('==== GET USER ====');
    try {
      const userStr = this.storage.getItem('utente');
      if (!userStr) {
        console.log('- No user found in storage');
        return null;
      }

      const user = JSON.parse(userStr);
      console.log('- User retrieved:', user?.nome, user?.cognome, user?.ruolo);
      return user;
    } catch (error) {
      console.error('- Error getting user:', error);
      return null;
    }
  }

  isAdmin(): boolean {
    const utente = this.getUtente();
    return !!utente && utente.ruolo?.toLowerCase() === 'admin';
  }

  isMedico(): boolean {
    const utente = this.getUtente();
    return !!utente && utente.ruolo?.toLowerCase() === 'medico';
  }

  isRuolo(ruolo: string): boolean {
    const utente = this.getUtente();
    return !!utente && utente.ruolo?.toLowerCase() === ruolo.toLowerCase();
  }
}
