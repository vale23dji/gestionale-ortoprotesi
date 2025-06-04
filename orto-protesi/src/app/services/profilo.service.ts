import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfiloService {
  // Correggi l'URL: senza "api" duplicato
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  cambiaPassword(email: string, vecchiaPassword: string, nuovaPassword: string): Observable<any> {
    const payload = {
      Email: email,
      VecchiaPassword: vecchiaPassword,
      NuovaPassword: nuovaPassword
    };

    // Accetta risposte in formato testo
    return this.http.post(
      `${this.apiUrl}/cambia-password`,
      payload,
      { responseType: 'text' }
    );
  }
}
