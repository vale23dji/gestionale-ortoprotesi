import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrivacyConsentService, ConsensoPrivacy } from '../services/privacy-consent.service';
import { CookieService } from 'ngx-cookie-service';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-cookie-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [CookieService],
  template: `
    <div *ngIf="showBanner" class="cookie-banner">
      <div class="cookie-content">
        <h3>Consenso all'utilizzo dei cookie</h3>
        <p>
          Questo sito utilizza cookie tecnici necessari per garantire le funzionalità e cookie di terze parti per analisi e marketing.
          Puoi scegliere quali cookie accettare. I cookie necessari sono sempre attivi perché essenziali per il funzionamento del sito.
          Per ulteriori informazioni consulta la nostra <a [routerLink]="['/privacy-policy']">Privacy Policy</a>.
        </p>

        <div class="cookie-categories">
          <div class="cookie-category">
            <div class="category-header">
              <div class="checkbox-container">
                <input type="checkbox" id="necessary" checked disabled>
                <label for="necessary">Cookie necessari</label>
              </div>
              <span class="mandatory-badge">Sempre attivi</span>
            </div>
            <p class="category-description">
              I cookie necessari sono fondamentali per il funzionamento del sito web. Non possono essere disattivati.
            </p>
          </div>

          <div class="cookie-category">
            <div class="category-header">
              <div class="checkbox-container">
                <input type="checkbox" id="analytics" [(ngModel)]="cookiePreferences.analytics">
                <label for="analytics">Cookie analitici</label>
              </div>
            </div>
            <p class="category-description">
              I cookie analitici aiutano a migliorare il sito tracciando l'utilizzo delle pagine e le performance.
            </p>
          </div>

          <div class="cookie-category">
            <div class="category-header">
              <div class="checkbox-container">
                <input type="checkbox" id="marketing" [(ngModel)]="cookiePreferences.marketing">
                <label for="marketing">Cookie di marketing</label>
              </div>
            </div>
            <p class="category-description">
              I cookie di marketing vengono utilizzati per offrirti contenuti personalizzati e annunci mirati.
            </p>
          </div>
        </div>

        <div class="cookie-actions">
          <button class="btn-secondary" (click)="rejectAllOptional()">
            Rifiuta opzionali
          </button>
          <button class="btn-tertiary" (click)="acceptSelected()">
            Salva preferenze
          </button>
          <button class="btn-primary" (click)="acceptAll()">
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background-color: rgba(33, 37, 41, 0.95);
      color: white;
      z-index: 1000;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
    }

    .cookie-content {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    h3 {
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 15px;
    }

    p {
      margin-bottom: 20px;
      line-height: 1.5;
      font-size: 14px;
    }

    a {
      color: #77c9ff;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .cookie-categories {
      margin-bottom: 20px;
    }

    .cookie-category {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 10px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
    }

    .checkbox-container input {
      margin-right: 10px;
      width: 18px;
      height: 18px;
    }

    .mandatory-badge {
      font-size: 12px;
      background-color: rgba(255, 255, 255, 0.2);
      padding: 4px 8px;
      border-radius: 10px;
    }

    .category-description {
      margin: 0;
      font-size: 12px;
      opacity: 0.8;
    }

    .cookie-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    button {
      padding: 10px 15px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background-color 0.2s;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0069d9;
    }

    .btn-secondary {
      background-color: transparent;
      color: white;
      border: 1px solid white;
    }

    .btn-secondary:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .btn-tertiary {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .btn-tertiary:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 768px) {
      .cookie-actions {
        flex-direction: column;
      }

      .cookie-content {
        padding: 15px;
      }
    }
  `]
})
export class CookieBannerComponent implements OnInit {
  showBanner = false;
  cookiePreferences: CookiePreferences = {
    necessary: true,
    analytics: true,
    marketing: false
  };

  constructor(
    private privacyService: PrivacyConsentService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.checkCookieConsent();
    }, 1000); // Leggero ritardo per non mostrare il banner immediatamente appena caricata la pagina
  }

  checkCookieConsent(): void {
    if (this.privacyService.verificaNecessitàConsenso()) {
      this.showBanner = true;

      // Leggi preferenze esistenti se disponibili
      const consents = this.privacyService.consensi$;
      consents.subscribe(consent => {
        if (consent) {
          this.cookiePreferences.analytics = consent.cookie;
          this.cookiePreferences.marketing = consent.marketing;
        }
      });
    }
  }

  acceptAll(): void {
    this.cookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    };

    this.savePreferences();
  }

  rejectAllOptional(): void {
    this.cookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false
    };

    this.savePreferences();
  }

  acceptSelected(): void {
    this.savePreferences();
  }

  private async savePreferences(): Promise<void> {
    // Recupera l'attuale stato dei consensi
    let currentConsents: ConsensoPrivacy | null = null;
    try {
      const { firstValueFrom } = await import('rxjs');
      currentConsents = await firstValueFrom(this.privacyService.consensi$);
    } catch {
      currentConsents = null;
    }
    currentConsents = currentConsents || {
      privacy: true,
      termini: true,
      gdpr: true,
      marketing: false,
      cookie: false
    };

    // Aggiorna con le preferenze dei cookie
    const updatedConsents: ConsensoPrivacy = {
      ...currentConsents,
      marketing: this.cookiePreferences.marketing,
      cookie: this.cookiePreferences.analytics
    };

    this.privacyService.accettaConsensi(updatedConsents).subscribe({
      next: () => {
        this.showBanner = false;
        this.setCookies();
      },
      error: err => {
        console.error('Errore nel salvare le preferenze cookie:', err);
        // Anche in caso di errore, nascondiamo il banner
        this.showBanner = false;
      }
    });
  }

  private setCookies(): void {
    // Imposta i cookie necessari
    this.cookieService.set('cookie_necessary', 'true', 365, '/');

    // Imposta i cookie analitici se accettati
    if (this.cookiePreferences.analytics) {
      this.cookieService.set('cookie_analytics', 'true', 365, '/');
      this.enableAnalytics();
    } else {
      this.cookieService.delete('cookie_analytics');
      this.disableAnalytics();
    }

    // Imposta i cookie di marketing se accettati
    if (this.cookiePreferences.marketing) {
      this.cookieService.set('cookie_marketing', 'true', 365, '/');
      this.enableMarketing();
    } else {
      this.cookieService.delete('cookie_marketing');
      this.disableMarketing();
    }
  }

  /**
   * Abilita servizi di analytics come Google Analytics
   */
  private enableAnalytics(): void {
    // Implementa il codice per attivare i servizi di analytics
    console.log('Analytics cookies enabled');

    // Esempio di attivazione Google Analytics
    if (typeof (window as any)['gtag'] !== 'undefined') {
      // Attiva Google Analytics
      (window as any)['gtag']('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }

  /**
   * Disabilita servizi di analytics
   */
  private disableAnalytics(): void {
    console.log('Analytics cookies disabled');

    // Esempio di disattivazione Google Analytics
    if (typeof (window as any)['gtag'] !== 'undefined') {
      // Disattiva Google Analytics
      (window as any)['gtag']('consent', 'update', {
        'analytics_storage': 'denied'
      });
    }

    // Rimuovi eventuali cookie di terze parti analitici
    this.removeThirdPartyCookies('_ga');
    this.removeThirdPartyCookies('_gid');
    this.removeThirdPartyCookies('_gat');
  }

  /**
   * Abilita servizi di marketing e pubblicità
   */
  private enableMarketing(): void {
    console.log('Marketing cookies enabled');

    // Esempio di attivazione cookie di marketing
    if (typeof (window as any)['gtag'] !== 'undefined') {
      (window as any)['gtag']('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    }
  }

  /**
   * Disabilita servizi di marketing e pubblicità
   */
  private disableMarketing(): void {
    console.log('Marketing cookies disabled');

    // Esempio di disattivazione cookie di marketing
    if (typeof (window as any)['gtag'] !== 'undefined') {
      (window as any)['gtag']('consent', 'update', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }

    // Rimuovi eventuali cookie di marketing
    this.removeThirdPartyCookies('_fbp');
    this.removeThirdPartyCookies('_gcl');
  }

  /**
   * Rimuove cookie di terze parti (pattern matching)
   */
  private removeThirdPartyCookies(pattern: string): void {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.indexOf(pattern) === 0) {
        // Elimina il cookie impostandolo con una data passata
        const name = cookie.split('=')[0];
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  }
}
