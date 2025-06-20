import { Subject } from 'rxjs';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsensoPrivacy, PrivacyConsentService } from '../../services/privacy-consent.service';
import { ChangeDetectorRef } from '@angular/core';

interface Tab {
  id: string;
  label: string;
  required: boolean;
}

@Component({
  selector: 'app-privacy-consent-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-consent-popup.component.html',
  styleUrl: './privacy-consent-popup.component.scss'
})
export class PrivacyConsentPopupComponent implements OnInit {
  @Input() mostraPopup = false;
  @Input() consentoChiusura = false; //Se false l utente non può chiudere senza accettare
  @Output() chiusoPopup = new EventEmitter<{accettato: boolean}>();

  tabAttivo = 'privacy';
  tabs: Tab[] = [
    { id: 'privacy', label: 'Privacy', required: true },
    { id: 'marketing', label: 'Marketing', required: false },
    { id: 'cookie', label: 'Cookie', required: false },
    { id: 'termini', label: 'Termini e condizioni', required: true },
    { id: 'gdpr', label: 'GDPR', required: true }
  ];

  consensi: ConsensoPrivacy = {
    privacy: false,
    marketing: false,
    cookie: false,
    termini: false,
    gdpr: false
  };

  constructor(
    private privacyConsentService: PrivacyConsentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.privacyConsentService.consensi$.subscribe(consensi => {
      if (consensi) {
        this.consensi = { ...consensi } as ConsensoPrivacy;
      }
    });
  }

  cambiaTab(tagId: string): void {
    this.tabAttivo = tagId;
  }

  toggleConsent(key: keyof ConsensoPrivacy): void {
   //log per debug
   console.log(`Toggling consent for: ${key}, current value: ${this.consensi[key]}`);

   //Creazione oggetto per aggirare il problema di TypeScript con keyof
   const nuovoConsenso: ConsensoPrivacy = {
    ...this.consensi,
    [key]: !this.consensi[key]
   };

   //sostituzione oggetto
   this.consensi = nuovoConsenso;
   console.log('Nuovo stato consensi:', this.consensi);
   this.cdr.detectChanges();
  }

  consentoTuttiObbligatori(): boolean {
    // Aggiungi un log per debug
    console.log('Stato consensi:', this.consensi);
    return this.consensi.privacy && this.consensi.termini && this.consensi.gdpr;
  }

  salvaEChiudi(): void {
    this.privacyConsentService.salvaConsensi(this.consensi);
    this.mostraPopup = false;
    this.chiusoPopup.emit({ accettato: true });
  }

  chiudi(): void {
    this.mostraPopup = false;
    this.chiusoPopup.emit({ accettato: false });
  }

}
