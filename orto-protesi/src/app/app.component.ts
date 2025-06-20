import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AuthServiceService } from './services/auth-service.service';
import { PrivacyConsentService } from './services/privacy-consent.service';
import { PrivacyConsentPopupComponent } from './shared/privacy-consent-popup/privacy-consent-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, PrivacyConsentPopupComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'orto-protesi';
  mostraPrivacyPopup = false;

  constructor(
    private authService: AuthServiceService,
    private router: Router,
    private privacyService: PrivacyConsentService
  ) {}

  ngOnInit(): void {
    console.log('==== APP COMPONENT INIT ====');

    // Controlla se l'utente è autenticato
    if (this.authService.isLogged()) {
      console.log('- User already logged in');

      const utente = this.authService.getUtente();
      if (utente && utente.ruolo) {
        // Verifica se è necessario mostrare il popup di privacy
        if (this.privacyService.verificaNecessitàConsenso()) {
          console.log('- Privacy consents needed, showing popup');
          this.mostraPrivacyPopup = true;
        } else {
          console.log('- Privacy consents already accepted');
        }

        // Gestione della navigazione in base al ruolo
        if (this.router.url === '/') {
          const ruolo = utente.ruolo.toLowerCase();
          const destination = ruolo === 'admin' ? '/dashboard' : '/mie-lavorazioni';
          console.log(`- Current URL is root, redirecting to ${destination}`);
          this.router.navigate([destination]);
        }
      }
    } else {
      // L'utente non è loggato
      console.log('- No user logged in at app init');
    }
    console.log('Popup visibility state:', this.mostraPrivacyPopup);

    console.log('Verifico necessità consenso:', this.privacyService.verificaNecessitàConsenso());
    console.log('Storage attuale:', localStorage.getItem('privacy_consents'));

    this.mostraPrivacyPopup = true;
  }

  onPrivacyPopupChiuso(event: {accettato: boolean}): void {
    this.mostraPrivacyPopup = false;
    console.log('Privacy popup chiuso, accettato:', event.accettato);

    // Se l'utente non ha accettato i termini obbligatori, si potrebbe decidere di fare logout
    if (!event.accettato && this.privacyService.verificaNecessitàConsenso()) {
      console.log('- User did not accept required consents, logging out');
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
