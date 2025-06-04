import { Component } from '@angular/core';

@Component({
  selector: 'app-accesso-negato',
  standalone: true,
  template: `
    <div class="accesso-negato">
      <h1>403 - Accesso Negato</h1>
      <p>Non hai i permessi per accedere a questa pagina.</p>
    </div>
  `,
  styles: [`
    .accesso-negato {
      padding: 2rem;
      text-align: center;
      color: #b00020;
    }
  `]
})
export class AccessoNegatoComponent {}
