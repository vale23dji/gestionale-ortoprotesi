import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthServiceService, Utente } from '../../services/auth-service.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  messaggio = '';
  errore = false;
  loading = false;
  //ruolo: string = '';
  showPassword: boolean = false;
  showConfermaPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthServiceService,
    private router: Router
  ) {
    if (this.authService.isLogged()) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      confermaEmail: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confermaPassword: ['', Validators.required],
    }, {
       validators: [this.passwordMatchValidator, this.emailMatchValidator]
  });
  }

  passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confermaPassword = group.get('confermaPassword')?.value;
    return password === confermaPassword ? null : { passwordMismatch: true };
  };

  emailMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const email = group.get('email')?.value;
    const confermaEmail = group.get('confermaEmail')?.value;
    return email === confermaEmail ? null : { emailMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfermaPasswordVisibility(): void {
    this.showConfermaPassword = !this.showConfermaPassword;
  }

  onSubmit(): void {
    console.log('Form inviato', this.registerForm.value);

    this.submitted = true;

    if (this.registerForm.invalid) return;

    const { nome, cognome, email, password } = this.registerForm.value;
    const utente: Utente = { nome, cognome, email, password, ruolo: '' };

    this.loading = true;
    this.authService.register(utente).subscribe({
      next: () => {
        this.messaggio = 'Registrazione avvenuta. Reindirizzamento in corso...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        console.error('Errore HTTP', err);
        this.messaggio = 'Errore durante la registrazione';
        this.errore = true;
        this.loading = false;
      }
    });
  }

  get f() { return this.registerForm.controls; }
}

