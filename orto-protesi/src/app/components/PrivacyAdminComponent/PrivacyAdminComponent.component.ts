import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-PrivacyAdminComponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './PrivacyAdminComponent.component.html',
  styleUrls: ['./PrivacyAdminComponent.component.css']
})
export class PrivacyAdminComponent implements OnInit {
  deletionRequests: any[] = [];
  userConsents: any[] = [];
  loading = {
    deletions: false,
    consents: false
  };
  
  filterOptions = {
    status: 'all',
    dateFrom: '',
    dateTo: ''
  };
  
  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadDeletionRequests();
    this.loadRecentConsents();
  }
  
  loadDeletionRequests() {
    this.loading.deletions = true;
    
    this.http.get<any[]>(`${environment.apiUrl}/admin/deletion-requests`, {
      params: {
        status: this.filterOptions.status,
        dateFrom: this.filterOptions.dateFrom,
        dateTo: this.filterOptions.dateTo
      }
    }).subscribe({
      next: (data) => {
        this.deletionRequests = data;
        this.loading.deletions = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento delle richieste di cancellazione', err);
        this.toastr.error('Errore nel caricamento delle richieste');
        this.loading.deletions = false;
      }
    });
  }
  
  loadRecentConsents() {
    this.loading.consents = true;
    
    this.http.get<any[]>(`${environment.apiUrl}/admin/recent-consents`).subscribe({
      next: (data) => {
        this.userConsents = data;
        this.loading.consents = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento dei consensi recenti', err);
        this.toastr.error('Errore nel caricamento dei consensi');
        this.loading.consents = false;
      }
    });
  }
  
  updateDeletionRequestStatus(requestId: number, newStatus: string, notes: string) {
    this.http.put(`${environment.apiUrl}/admin/deletion-requests/${requestId}`, {
      status: newStatus,
      notes: notes
    }).subscribe({
      next: () => {
        this.toastr.success('Stato della richiesta aggiornato');
        this.loadDeletionRequests();
      },
      error: (err) => {
        console.error('Errore nell\'aggiornamento della richiesta', err);
        this.toastr.error('Errore nell\'aggiornamento della richiesta');
      }
    });
  }
  
  executeDataDeletion(userId: number, requestId: number) {
    if (!confirm(`Sei sicuro di voler cancellare tutti i dati dell'utente ID ${userId}? Questa azione è irreversibile.`)) {
      return;
    }
    
    this.http.delete(`${environment.apiUrl}/admin/users/${userId}`).subscribe({
      next: () => {
        this.toastr.success('Dati utente eliminati con successo');
        this.updateDeletionRequestStatus(requestId, 'Completata', 'Dati eliminati come richiesto');
      },
      error: (err) => {
        console.error('Errore nella cancellazione dei dati', err);
        this.toastr.error('Errore nella cancellazione dei dati');
      }
    });
  }
  
  applyFilters() {
    this.loadDeletionRequests();
  }
  
  resetFilters() {
    this.filterOptions = {
      status: 'all',
      dateFrom: '',
      dateTo: ''
    };
    this.loadDeletionRequests();
  }
}
