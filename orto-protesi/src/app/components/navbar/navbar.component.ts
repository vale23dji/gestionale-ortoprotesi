import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';
import { StorageService } from '../../services/storage.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { DebugService } from '../../services/debug.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Nome del componente per i log
  private readonly COMPONENT_NAME = 'NavbarComponent';

  // Sostituisci variabili semplici con BehaviorSubject per reattività
  private ruoloSubject = new BehaviorSubject<string | null>(null);
  ruolo$ = this.ruoloSubject.asObservable();

  private isLoggedSubject = new BehaviorSubject<boolean>(false);
  isLogged$ = this.isLoggedSubject.asObservable();

  // Per memorizzare nome e cognome dell'utente
  nome: string | null = null;
  cognome: string | null = null;

  // Gestione sottoscrizioni
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthServiceService,
    private storage: StorageService,
    private debug: DebugService
  ) {
    ;
  }

  ngOnInit(): void {

    // Carica subito lo stato attuale
    this.updateAuthState();

    // Sottoscrivi ai cambiamenti di stato dell'autenticazione
    this.subscriptions.add(
      this.authService.authState$.subscribe(() => {
        this.debug.debug(this.COMPONENT_NAME, 'Cambio stato autenticazione rilevato');
        this.updateAuthState();
      })
    );

    this.debug.info(this.COMPONENT_NAME, 'Inizializzazione completata');
  }

  //Sono un commento per il test del branch sul fork

  ngOnDestroy(): void {
    // Prima di tutto, annulla le sottoscrizioni
      this.subscriptions.unsubscribe();


    // Poi, usa la versione sicura di console.log invece di debug.debug
    // in questo modo non facciamo chiamate a servizi che potrebbero essere già distrutti
    console.debug(`[${this.COMPONENT_NAME}] Pulizia sottoscrizioni e distruzione componente`);
  }

  private updateAuthState(): void {
    this.debug.debug(this.COMPONENT_NAME, 'Aggiornamento stato autenticazione');
    const isLoggedIn = this.authService.isLogged();
    this.isLoggedSubject.next(isLoggedIn);

    if (isLoggedIn) {
      const utente = this.authService.getUtente();
      if (utente) {
        const ruoloUtente = utente.ruolo?.toLowerCase() || null;
        this.debug.info(this.COMPONENT_NAME, `Utente autenticato con ruolo: ${ruoloUtente}`, {
          nome: utente.nome,
          cognome: utente.cognome,
          email: utente.email
        });

        // Aggiorna il ruolo e i dati utente
        this.ruoloSubject.next(ruoloUtente);
        this.nome = utente.nome || null;
        this.cognome = utente.cognome || null;
      } else {
        this.debug.warn(this.COMPONENT_NAME, 'Dati utente mancanti nonostante sia autenticato');
        this.ruoloSubject.next(null);
      }
    } else {
      this.debug.debug(this.COMPONENT_NAME, 'Utente non autenticato');
      this.ruoloSubject.next(null);
      this.nome = null;
      this.cognome = null;
    }
  }

  // Helper methods for templates
  isAdmin(): boolean {
    return this.ruoloSubject.value === 'admin';
  }

  isMedico(): boolean {
    return this.ruoloSubject.value === 'medico';
  }

  logout(): void {
    this.debug.info(this.COMPONENT_NAME, 'Logout richiesto');
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
