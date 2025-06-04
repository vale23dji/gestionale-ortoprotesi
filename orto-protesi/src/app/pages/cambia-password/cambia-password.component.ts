import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../../services/auth-service.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ProfiloService } from '../../services/profilo.service';
import { DebugService } from '../../services/debug.service';

@Component({
  selector: 'app-cambia-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './cambia-password.component.html',
  styleUrls: ['./cambia-password.component.scss']
})

export class CambiaPasswordComponent {
  // Nome del componente per i log
  private readonly COMPONENT_NAME = 'CambiaPasswordComponent';

  attuale = '';
  nuova = '';
  conferma = '';
  messaggio = '';
  loading = false;
  errore = false;
  showAttuale = false;
  showNuova = false;
  showConferma = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthServiceService,
    private profiloService: ProfiloService,
    private debug: DebugService
  ) {
    this.debug.debug(this.COMPONENT_NAME, 'Componente inizializzato');
  }

  cambiaPassword() {
    this.debug.debug(this.COMPONENT_NAME, 'Richiesta cambio password');

    this.messaggio = '';
    this.errore = false;

    // Validazione
    if (this.nuova.length < 8) {
      const errorMsg = 'La nuova password deve avere almeno 8 caratteri.';
      this.debug.warn(this.COMPONENT_NAME, errorMsg);
      this.messaggio = errorMsg;
      this.errore = true;
      return;
    }

    if (this.nuova !== this.conferma) {
      const errorMsg = 'Le nuove password non coincidono';
      this.debug.warn(this.COMPONENT_NAME, errorMsg);
      this.messaggio = errorMsg;
      this.errore = true;
      return;
    }

    const utente = this.auth.getUtente();
    if (!utente || !utente.email) {
      const errorMsg = 'Utente non valido o sessione scaduta';
      this.debug.warn(this.COMPONENT_NAME, errorMsg, { utente });
      this.messaggio = errorMsg;
      this.errore = true;
      return;
    }

    this.loading = true;
    this.debug.info(this.COMPONENT_NAME, 'Invio richiesta cambio password', { email: utente.email });

    // Payload con nomi di proprietà che corrispondono al backend
    const payload = {
      Email: utente.email,
      VecchiaPassword: this.attuale,
      NuovaPassword: this.nuova
    };

    // Log del payload (senza mostrare la password completa)
    this.debug.debug(this.COMPONENT_NAME, 'Payload richiesta cambio password', {
      Email: payload.Email,
      VecchiaPassword: '********',
      NuovaPassword: '********',
      lunghezzaVecchiaPassword: this.attuale.length,
      lunghezzaNuovaPassword: this.nuova.length
    });

    // URL completo per debug
    const url = `${environment.apiUrl}/auth/cambia-password`;
    this.debug.debug(this.COMPONENT_NAME, `Invio richiesta a: ${url}`);

    // Impostiamo responseType: 'text' per accettare risposte in formato testo
    this.http.post(url, payload, {
      responseType: 'text',
      observe: 'response'
    })
    .subscribe({
      next: (response) => {
        this.debug.info(this.COMPONENT_NAME, 'Password cambiata con successo', {
          status: response.status,
          statusText: response.statusText
        });

        this.messaggio = 'Password cambiata con successo';
        this.errore = false;
        this.loading = false;

        // Pulisce i campi
        this.attuale = '';
        this.nuova = '';
        this.conferma = '';

        this.debug.debug(this.COMPONENT_NAME, 'Reindirizzamento al profilo tra 1.5 secondi');
        setTimeout(() => this.router.navigate(['/profilo']), 1500);
      },
      error: (err) => {
        this.debug.error(this.COMPONENT_NAME, 'Errore cambio password', {
          status: err.status,
          statusText: err.statusText,
          errorBody: typeof err.error === 'string' ? err.error : 'Vedi log completo'
        });

        // Tenta di estrarre il messaggio di errore indipendentemente dal formato
        let errorMsg = '';

        if (err.error) {
          if (typeof err.error === 'string') {
            // Se l'errore è una stringa (testo)
            errorMsg = err.error;
          } else if (err.error.message) {
            // Se l'errore è un oggetto JSON con una proprietà message
            errorMsg = err.error.message;
          }
        }

        if (!errorMsg) {
          // Fallback per altri tipi di errori
          errorMsg = 'Errore: password attuale errata o altro problema';
        }

        this.messaggio = `Errore: ${errorMsg}`;
        this.errore = true;
        this.loading = false;
      }
    });
  }

  // Metodi per gestire la visibilità delle password
  toggleShowAttuale(): void {
    this.debug.verbose(this.COMPONENT_NAME, `Toggle visibilità password attuale: ${!this.showAttuale}`);
    this.showAttuale = !this.showAttuale;
  }

  toggleShowNuova(): void {
    this.debug.verbose(this.COMPONENT_NAME, `Toggle visibilità nuova password: ${!this.showNuova}`);
    this.showNuova = !this.showNuova;
  }

  toggleShowConferma(): void {
    this.debug.verbose(this.COMPONENT_NAME, `Toggle visibilità conferma password: ${!this.showConferma}`);
    this.showConferma = !this.showConferma;
  }
}
