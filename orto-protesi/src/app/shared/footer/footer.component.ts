import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService, Utente } from '../../services/auth-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [CommonModule]
})

export class FooterComponent implements OnInit {
  annoCorrente: number = new Date().getFullYear();
  appVersion: string = '1.0.0';
  dataUltimoAggiornamento: string = '01/06/2025';
  utenteLoggato: Utente | null = null;

  constructor(
    private router: Router,
    private authService: AuthServiceService
  ) {}

  ngOnInit(): void {
    this.utenteLoggato = this.authService.getUtente();
  }

  vaiA(path: string): void {
    this.router.navigate([`/${path}`]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
