import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Interfaccia per i consensi
interface ConsensoCliente {
  id: string;
  descrizione: string;
  dettagli?: string;
  valore: boolean;
  obbligatorio: boolean;
  soloLettura: boolean;
}

@Component({
  selector: 'app-client-consent-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-consent-form.component.html',
  styleUrl: './client-consent-form.component.scss'
})

export class ClientConsentFormComponent {
  @Input() pazienteNome: string = '';
  @Input() disabilitato: boolean = false;
  @Input() mostraFirma: boolean = true;
  @Input() mostiaAnnulla: boolean = true;

  @Output() annullaEvent = new EventEmitter<void>();
  @Output() salvaEvent = new EventEmitter<{consensi: ConsensoCliente[], firma?: string}>();

  @ViewChild('signaturePad') signaturePad!: ElementRef;

  dataOdierna: Date = new Date();

  consensi: ConsensoCliente[] = [
    {
      id: 'trattamento-dati',
      descrizione: 'Acconsento al trattamento dei miei dati personali per finalità di cura',
      dettagli: 'I dati saranno utilizzati esclusivamente per finalità di diagnosi e cura.',
      valore: false,
      obbligatorio: true,
      soloLettura: false
    },
    {
      id: 'comunicazioni',
      descrizione: 'Acconsento a ricevere comunicazioni relative ai miei appuntamenti',
      valore: false,
      obbligatorio: false,
      soloLettura: false
    },
    {
      id: 'marketing',
      descrizione: 'Acconsento a ricevere comunicazioni promozionali e newsletter',
      dettagli: 'Potrai disiscriverti in qualsiasi momento tramite il link presente in ogni comunicazione.',
      valore: false,
      obbligatorio: false,
      soloLettura: false
    },
    {
      id: 'cartella-condivisa',
      descrizione: 'Acconsento alla condivisione della mia cartella clinica con altri specialisti coinvolti nel trattamento',
      valore: false,
      obbligatorio: false,
      soloLettura: false
    }
  ];

  private firmaSvg: string = '';

  constructor() {}

  tuttiConsensiObbligatoriDati(): boolean {
    return this.consensi
      .filter(consenso => consenso.obbligatorio)
      .every(consenso => consenso.valore === true);
  }

  pulisciFirma(): void {
    // In un'implementazione reale, qui puliresti il canvas della firma
    // Per esempio usando una libreria come SignaturePad
    console.log('Pulizia firma');
    this.firmaSvg = '';

    // Se stai usando una libreria per il canvas, dovresti pulirlo così:
    // const canvas = this.signaturePad.nativeElement;
    // const context = canvas.getContext('2d');
    // context.clearRect(0, 0, canvas.width, canvas.height);
  }

  salvaConsensi(): void {
    // In un'implementazione reale, qui salveresti anche la firma
    // Per esempio convertendo il canvas in base64
    this.salvaEvent.emit({
      consensi: this.consensi,
      firma: this.firmaSvg
    });
  }

  annulla(): void {
    this.annullaEvent.emit();
  }
}
