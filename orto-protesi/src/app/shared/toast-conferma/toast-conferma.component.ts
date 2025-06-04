import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-toast-conferma',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-conferma.component.html',
  styleUrls: ['./toast-conferma.component.scss']
})
export class ToastConfermaComponent {
  @Input() messaggio: string = 'Sei sicuro di voler procedere?';
  @Output() conferma = new EventEmitter<void>();
  @Output() annulla = new EventEmitter<void>();

  onConferma() {
    this.conferma.emit();
  }

  onAnnulla() {
    this.annulla.emit();
  }
}
