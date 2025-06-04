import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-verifica-email',
  imports: [CommonModule],
  templateUrl: './verifica-email.component.html',
  styleUrl: './verifica-email.component.scss'
})
export class VerificaEmailComponent implements OnInit {
  messaggio = '';
  errore = false;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.http
      .get(`${environment.apiUrl}/auth/confirm-email?token=${token}`)
      .subscribe({
        next: (res: any) => {
          this.messaggio = res;
          setTimeout(() => this.router.navigate(['/login']), 2500);
        },
        error: (err) => {
          this.errore = true;
          this.messaggio = err.error || 'Errore durante la verifica email.';
        },
      });
    } else {
      this.errore = true;
      this.messaggio = 'Token mancante o non valido.';
    }
  }
}
