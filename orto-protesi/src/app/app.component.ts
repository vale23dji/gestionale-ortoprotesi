import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthServiceService } from './services/auth-service.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'orto-protesi';

  constructor(
    private authService: AuthServiceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('==== APP COMPONENT INIT ====');
    
    // Controlla se l'utente è già autenticato e reindirizza se necessario
    if (this.authService.isLogged()) {
      console.log('- User already logged in');
      
      const utente = this.authService.getUtente();
      if (utente && utente.ruolo) {
        const ruolo = utente.ruolo.toLowerCase();
        console.log('- User role:', ruolo);
        
        // Se siamo su root route (/), reindirizza in base al ruolo
        if (this.router.url === '/') {
          const destination = ruolo === 'admin' ? '/dashboard' : '/mie-lavorazioni';
          console.log(`- Current URL is root, redirecting to ${destination}`);
          this.router.navigate([destination]);
        }
      }
    } else {
      console.log('- No user logged in at app init');
    }
  }
}
