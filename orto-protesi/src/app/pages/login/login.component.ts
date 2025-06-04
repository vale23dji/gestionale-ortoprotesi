import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService, Utente } from '../../services/auth-service.service';
import { isPlatformBrowser } from '@angular/common';

export interface LoginResponse {
  token: string;
  utente: Utente;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  messaggio: string = '';
  loading: boolean = false;
  errore: boolean = false;
  submitted = false;
  showPassword: boolean = false;
  ricordaUtente: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('==== LOGIN COMPONENT INIT ====');

    // Controlla se siamo in ambiente browser
    const isBrowser = isPlatformBrowser(platformId);
    console.log('- Is browser environment:', isBrowser);

    // Prova a caricare la preferenza ricordami
    let rememberPref = true;
    if (isBrowser) {
      try {
        rememberPref = localStorage.getItem('remember_user') !== "false"; // default a true
        console.log('- Loaded remember preference:', rememberPref);
      } catch (e) {
        console.error('- Error loading remember preference:', e);
      }
    }

    // Inizializza form con preferenza caricata
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      ricordaUtente: [rememberPref]
    });
    console.log('- Form initialized with remember preference:', rememberPref);

    // Controlla se utente già loggato
    if (this.authService.isLogged()) {
      console.log('- User already logged in, redirecting...');
      const utente = this.authService.getUtente();
      if (utente && utente.ruolo) {
        const destination = utente.ruolo.toLowerCase() === 'admin' ? '/dashboard' : '/mie-lavorazioni';
        console.log(`- Redirecting to ${destination} based on role:`, utente.ruolo);
        this.router.navigate([destination]);
      }
    } else {
      console.log('- No active session found');
    }
  }

  ngOnInit(): void {
    // Non usare inject() qui
  }

  get f() { return this.loginForm.controls; }

  login(): void {
    console.log('==== LOGIN METHOD CALLED ====');
    this.submitted = true;

    if (this.loginForm.invalid) {
      console.log('- Form is invalid, aborting login');
      return;
    }

    this.loading = true;
    this.errore = false;

    const { email, password } = this.loginForm.value;
    const ricordaUtente = !!this.loginForm.value.ricordaUtente; // Assicura valore booleano

    console.log('- Login attempt with:');
    console.log('  - Email:', email);
    console.log('  - Remember me:', ricordaUtente);

    // Imposta preferenza ricordami prima del login
    console.log('- Setting remember preference before login');
    this.authService.setRemember(ricordaUtente);

    console.log('- Calling auth service login method');
    this.authService.login(email, password).subscribe({
      next: (res) => {
        console.log('- Login successful');
        console.log('- User role:', res.utente.ruolo);

        this.messaggio = `Benvenuto ${res.utente.nome} ${res.utente.cognome}`;
        this.loading = false;

        const destination = res.utente.ruolo?.toLowerCase() === 'admin' ? '/dashboard' : '/mie-lavorazioni';
        console.log(`- Navigating to ${destination}`);

        this.router.navigate([destination]);
      },
      error: (err) => {
        console.error('- Login failed:', err);

        // Estrai il messaggio di errore in base al formato
        let errorMessage = 'Errore durante il login.';

        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        }

        this.messaggio = errorMessage;
        this.errore = true;
        this.loading = false;

        // Log per debug
        console.error('- Status code:', err.status);
        console.error('- Response type:', typeof err.error);
      },
    });
  }

  resendEmail(): void {
    const email = this.loginForm.get('email')?.value;

    if(!email) {
      this.messaggio = 'Inserisci email per ricevere il link di verifica.';
      this.errore = true;
      return;
    }

    this.loading = true;

    this.authService.resendVerificationEmail(email).subscribe({
      next: (res: any) => {
        this.messaggio = res;
        this.loading = false;
        this.errore = false;
      },
      error: (err: any) => {
        this.messaggio = err.error || "Errore durante il rinvio dell'email.";
        this.errore = true;
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
