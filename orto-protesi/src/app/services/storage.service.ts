import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private useLocal: boolean = true;

  constructor() {
    console.log('==== STORAGE SERVICE INIT ====');
    
    if (typeof window !== 'undefined') {
      console.log('- Browser environment detected');
      
      if (window.localStorage) {
        const savedPref = localStorage.getItem('remember_user');
        console.log('- Saved preference found:', savedPref);
        
        // Se esplicitamente impostato, usa quel valore, altrimenti default a true
        this.useLocal = savedPref !== null ? savedPref === "true" : true;
        console.log('- Using storage:', this.useLocal ? 'localStorage' : 'sessionStorage');
        
        // Debug: verifica contenuto storage all'inizializzazione
        this.logStorageContent();
      } else {
        console.warn('- localStorage not available!');
      }
    } else {
      console.warn('- Non-browser environment detected');
    }
  }
  
  // Metodo di debug per verificare contenuto storage
  private logStorageContent(): void {
    if (typeof window === 'undefined') return;
    
    console.log('==== STORAGE CONTENT ====');
    if (window.localStorage) {
      const token = localStorage.getItem('token');
      const utente = localStorage.getItem('utente');
      console.log('- localStorage token:', token ? 'present' : 'missing');
      console.log('- localStorage utente:', utente ? 'present' : 'missing');
      if (utente) {
        try {
          const utenteObj = JSON.parse(utente);
          console.log('  - user details:', utenteObj.nome, utenteObj.cognome, utenteObj.ruolo);
        } catch (e) {
          console.error('  - error parsing user:', e);
        }
      }
    }
    
    if (window.sessionStorage) {
      const token = sessionStorage.getItem('token');
      const utente = sessionStorage.getItem('utente');
      console.log('- sessionStorage token:', token ? 'present' : 'missing');
      console.log('- sessionStorage utente:', utente ? 'present' : 'missing');
    }
    console.log('=========================');
  }

  isBrowser(): boolean { 
    return typeof window !== 'undefined'; 
  }

  setPersistence(remember: boolean): void {
    console.log('==== SETTING PERSISTENCE ====');
    console.log(`- Changing storage from ${this.useLocal ? 'localStorage' : 'sessionStorage'} to ${remember ? 'localStorage' : 'sessionStorage'}`);
    
    // Salva l'impostazione attuale
    const wasLocal = this.useLocal;
    
    // Aggiorna l'impostazione
    this.useLocal = remember;
    
    // Salva la preferenza in localStorage
    if (this.isBrowser() && window.localStorage) {
      localStorage.setItem('remember_user', remember.toString());
      console.log(`- Saved preference 'remember_user'=${remember}`);
    }
    
    // Gestisci il trasferimento dei dati tra storage
    if (this.isBrowser()) {
      // Se cambiamo tipo di storage, migra i dati
      if (wasLocal !== remember) {
        console.log('- Storage type changed, migrating data...');
        
        const sourceStorage = wasLocal ? localStorage : sessionStorage;
        const targetStorage = remember ? localStorage : sessionStorage;
        
        const token = sourceStorage.getItem('token');
        const utente = sourceStorage.getItem('utente');
        const ruolo = sourceStorage.getItem('ruolo');
        
        // Migra dati se presenti
        if (token) {
          targetStorage.setItem('token', token);
          console.log('  - Migrated token');
        }
        if (utente) {
          targetStorage.setItem('utente', utente);
          console.log('  - Migrated utente');
        }
        if (ruolo) {
          targetStorage.setItem('ruolo', ruolo);
          console.log('  - Migrated ruolo');
        }
        
        // Pulisci storage di origine
        sourceStorage.removeItem('token');
        sourceStorage.removeItem('utente');
        sourceStorage.removeItem('ruolo');
        console.log('  - Cleared source storage');
      } else {
        console.log('- Storage type unchanged, no migration needed');
      }
    }
    
    // Verifica contenuto storage dopo la modifica
    this.logStorageContent();
  }

  private get store(): Storage {
    if (!this.isBrowser()) {
      console.warn('Attempting to access storage in non-browser environment');
      return this.getNullStorage();
    }
    
    if (this.useLocal) {
      return window.localStorage || this.getNullStorage();
    } else {
      return window.sessionStorage || this.getNullStorage();
    }
  }

  private getNullStorage(): Storage {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    } as Storage;
  }

  setItem(k: string, v: string): void { 
    console.log(`Setting ${k} in ${this.useLocal ? 'localStorage' : 'sessionStorage'}`);
    this.store.setItem(k, v);
  }

  getItem(k: string): string | null { 
    const value = this.store.getItem(k);
    console.log(`Reading ${k} from ${this.useLocal ? 'localStorage' : 'sessionStorage'}: ${value ? 'found' : 'not found'}`);
    return value;
  }

  removeItem(k: string): void { 
    console.log(`Removing ${k} from ${this.useLocal ? 'localStorage' : 'sessionStorage'}`);
    this.store.removeItem(k);
  }

  clear(): void { 
    console.log(`Clearing ${this.useLocal ? 'localStorage' : 'sessionStorage'}`);
    this.store.clear();
  }
}
