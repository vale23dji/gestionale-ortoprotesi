import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthServiceService, Utente } from '../../services/auth-service.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-profilo',
  imports: [CommonModule, FormsModule],
  templateUrl: './profilo.component.html',
  styleUrls: ['./profilo.component.scss']
})
export class ProfiloComponent implements OnInit {

  utente: Utente | null = null;

  constructor (private authService: AuthServiceService) {}

  ngOnInit(): void {
    this.utente = this.authService.getUtente();

  }

}
