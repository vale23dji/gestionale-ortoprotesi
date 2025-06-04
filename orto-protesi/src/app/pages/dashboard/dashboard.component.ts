import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthServiceService, Utente } from '../../services/auth-service.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})

export class DashboardComponent {
  utente : Utente | null = null;
  constructor(private authService: AuthServiceService, private router: Router) {
    this.utente = this.authService.getUtente();
  }

  vaiA(path: string) {
    this.router.navigate([`/${path}`]);
  }
}
