import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';

/**
 * Livelli di debug disponibili
 */
export enum DebugLevel {
  OFF = 0,       // Nessun log
  ERROR = 1,     // Solo errori
  WARN = 2,      // Warning ed errori
  INFO = 3,      // Info, warning ed errori
  DEBUG = 4,     // Debug, info, warning ed errori
  VERBOSE = 5    // Tutto, inclusi log dettagliati
}

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  /**
   * Livello di debug corrente - impostiamo un livello più restrittivo in produzione
   * per ridurre i messaggi non essenziali
   */
  private currentDebugLevel: DebugLevel = environment.production ? DebugLevel.ERROR : DebugLevel.WARN;

  /**
   * Per impostazione predefinita, disabilitiamo i toast di debug
   * Si possono attivare manualmente quando servono
   */
  private showToasts: boolean = false;

  /**
   * Se true, ogni log includerà timestamp e origine
   */
  private verboseLogging: boolean = false;

  /**
   * Flag per tracciare quando l'app sta per essere distrutta
   */
  private isAppDestroying: boolean = false;

  constructor(private toastr: ToastrService) {
    // Nessun log iniziale
  }

  /**
   * Da chiamare quando l'applicazione sta per essere distrutta
   */
  markAppAsDestroying(): void {
    this.isAppDestroying = true;
  }

  /**
   * Imposta il livello di debug
   */
  setDebugLevel(level: DebugLevel): void {
    this.currentDebugLevel = level;
  }

  /**
   * Attiva/disattiva la visualizzazione dei toast di debug
   */
  toggleToasts(enabled: boolean): void {
    this.showToasts = enabled;
  }

  /**
   * Attiva/disattiva la modalità di logging verboso
   */
  toggleVerboseLogging(enabled: boolean): void {
    this.verboseLogging = enabled;
  }

  /**
   * Log di errore - sempre attivi
   */
  error(source: string, message: string, data?: any): void {
    if (this.currentDebugLevel >= DebugLevel.ERROR) {
      const formattedMessage = this.formatMessage('ERROR', source, message);
      console.error(formattedMessage, data !== undefined ? data : '');

      if (this.showToasts && !this.isAppDestroying) {
        try {
          this.toastr.error(message, `Errore in ${source}`, {
            timeOut: 5000,
            progressBar: true
          });
        } catch (err) {
          console.error('Errore durante visualizzazione toast:', err);
        }
      }
    }
  }

  /**
   * Log di warning
   */
  warn(source: string, message: string, data?: any): void {
    if (this.currentDebugLevel >= DebugLevel.WARN) {
      const formattedMessage = this.formatMessage('WARN', source, message);
      console.warn(formattedMessage, data !== undefined ? data : '');

      if (this.showToasts && !this.isAppDestroying) {
        try {
          this.toastr.warning(message, `Avviso in ${source}`, {
            timeOut: 4000,
            progressBar: true
          });
        } catch (err) {
          console.error('Errore durante visualizzazione toast:', err);
        }
      }
    }
  }

  /**
   * Log informativo - usato solo per informazioni importanti
   */
  info(source: string, message: string, data?: any): void {
    if (this.currentDebugLevel >= DebugLevel.INFO) {
      const formattedMessage = this.formatMessage('INFO', source, message);
      console.info(formattedMessage, data !== undefined ? data : '');

      if (this.showToasts && !this.isAppDestroying) {
        try {
          this.toastr.info(message, `Info da ${source}`, {
            timeOut: 3000,
            progressBar: true
          });
        } catch (err) {
          console.error('Errore durante visualizzazione toast:', err);
        }
      }
    }
  }

  /**
   * Log di debug - disattivato in produzione
   */
  debug(source: string, message: string, data?: any): void {
    if (this.currentDebugLevel >= DebugLevel.DEBUG) {
      const formattedMessage = this.formatMessage('DEBUG', source, message);
      console.debug(formattedMessage, data !== undefined ? data : '');

      // Non mostriamo toast per debug
    }
  }

  /**
   * Log verboso - solo per sviluppo avanzato
   */
  verbose(source: string, message: string, data?: any): void {
    if (this.currentDebugLevel >= DebugLevel.VERBOSE) {
      const formattedMessage = this.formatMessage('VERBOSE', source, message);
      console.log(formattedMessage, data !== undefined ? data : '');
    }
  }

  /**
   * Formatta il messaggio di log
   */
  private formatMessage(level: string, source: string, message: string): string {
    if (!this.verboseLogging) {
      return `[${source}] ${message}`;
    }

    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    return `[${timestamp}] [${level}] [${source}] ${message}`;
  }
}
