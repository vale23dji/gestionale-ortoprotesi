import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrivacyConsentService, ConsensoPrivacy } from '../../services/privacy-consent.service';
import { StorageService } from '../../services/storage.service';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';

@Component({
   selector: 'app-GdprRightsComponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './GdprRightsComponent.component.html',
  styleUrls: ['./GdprRightsComponent.component.css']
})
export class GdprRightsComponent implements OnInit {
  currentConsents: ConsensoPrivacy | null = null;
  displayedConsents: Array<{ key: keyof ConsensoPrivacy, label: string, value: boolean, canToggle: boolean }> = [];

  userId: number | null = null;

  // Stato per esportazione dati
  exportLoading = false;

  // Stato per richiesta cancellazione
  deletionReason = '';
  deletionRequestLoading = false;
  showDeletionConfirm = false;

  // Messaggi di feedback
  message: string | null = null;
  messageType: 'success' | 'error' | null = null;

  constructor(
    private privacyService: PrivacyConsentService,
    private storageService: StorageService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Carica l'ID utente
    const userString = this.storageService.getItem('utente');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        this.userId = user?.id || null;
      } catch (e) {
        console.error('Errore nel parsing dei dati utente:', e);
      }
    }

    // Sottoscrivi ai consensi
    this.privacyService.consensi$.subscribe(consents => {
      this.currentConsents = consents;
      this.updateDisplayedConsents();
    });
  }

  updateDisplayedConsents() {
    if (!this.currentConsents) return;

    this.displayedConsents = [
      { key: 'privacy', label: 'Privacy Policy', value: this.currentConsents.privacy, canToggle: false },
      { key: 'termini', label: 'Termini e Condizioni', value: this.currentConsents.termini, canToggle: false },
      { key: 'gdpr', label: 'Trattamento dati GDPR', value: this.currentConsents.gdpr, canToggle: false },
      { key: 'marketing', label: 'Marketing e comunicazioni', value: this.currentConsents.marketing, canToggle: true },
      { key: 'cookie', label: 'Cookie analitici e di profilazione', value: this.currentConsents.cookie, canToggle: true },
    ];
  }

  toggleConsent(key: keyof ConsensoPrivacy) {
    if (!this.currentConsents) return;

    // Verifica che sia possibile modificare questo consenso
    if (key !== 'marketing' && key !== 'cookie') {
      this.toastr.error('Non è possibile modificare i consensi obbligatori');
      return;
    }

    const updatedConsents = { ...this.currentConsents };
    updatedConsents[key] = !updatedConsents[key];

    this.privacyService.accettaConsensi(updatedConsents).subscribe({
      next: () => {
        this.toastr.success(`Preferenza "${key}" aggiornata con successo`);
      },
      error: err => {
        console.error('Errore nell\'aggiornamento del consenso:', err);
        this.toastr.error('Errore nell\'aggiornamento del consenso');
      }
    });
  }

  exportData() {
    if (!this.userId) {
      this.toastr.error('Utente non identificato');
      return;
    }

    this.exportLoading = true;
    this.privacyService.richiediEsportazioneDati(this.userId).subscribe({
      next: (blob) => {
        saveAs(blob, `dati_personali_${this.userId}_${new Date().toISOString().split('T')[0]}.zip`);
        this.exportLoading = false;
        this.toastr.success('Esportazione completata con successo');
      },
      error: (err) => {
        console.error('Errore nell\'esportazione dei dati:', err);
        this.exportLoading = false;
        this.toastr.error('Errore nell\'esportazione dei dati');
      }
    });
  }

  openDeletionConfirmation() {
    this.showDeletionConfirm = true;
  }

  cancelDeletion() {
    this.showDeletionConfirm = false;
  }

  confirmDeletion() {
    if (!this.userId) {
      this.showDeletionConfirm = false;
      this.toastr.error('Utente non identificato');
      return;
    }

    this.deletionRequestLoading = true;
    this.privacyService.richiediCancellazioneDati(this.userId, this.deletionReason).subscribe({
      next: () => {
        this.deletionRequestLoading = false;
        this.showDeletionConfirm = false;
        this.toastr.success('La tua richiesta di cancellazione è stata registrata. Verrai contattato entro 30 giorni.');
      },
      error: (err) => {
        console.error('Errore nella richiesta di cancellazione:', err);
        this.deletionRequestLoading = false;
        this.showDeletionConfirm = false;
        this.toastr.error('Errore nell\'invio della richiesta di cancellazione');
      }
    });
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';

    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}
