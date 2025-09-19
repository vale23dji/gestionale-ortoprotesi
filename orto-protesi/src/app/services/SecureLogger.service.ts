import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

// Livelli di log
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

@Injectable({
  providedIn: 'root'
})
export class SecureLoggerService {
  // Configura il livello minimo di log in base all'ambiente
  private minLevel = environment.production ? LogLevel.Warn : LogLevel.Debug;
  
  // Record di dati sensibili da non includere mai nei log
  private sensitiveDataPatterns: RegExp[] = [
    /password/i,
    /token/i,
    /credenziali/i,
    /\d{16}/,  // Blocca numeri di carta di credito
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,  // Blocca email
    /\b(?:(?:\+|00)39)?(?:3[1-9]\d{8}|0\d{5,10})\b/  // Blocca numeri di telefono italiani
  ];
  
  constructor() { }
  
  debug(component: string, message: string, data?: any): void {
    this.log(LogLevel.Debug, component, message, data);
  }
  
  info(component: string, message: string, data?: any): void {
    this.log(LogLevel.Info, component, message, data);
  }
  
  warn(component: string, message: string, data?: any): void {
    this.log(LogLevel.Warn, component, message, data);
  }
  
  error(component: string, message: string, error?: any): void {
    this.log(LogLevel.Error, component, message, this.sanitizeError(error));
  }
  
  private log(level: LogLevel, component: string, message: string, data?: any): void {
    // Non loggare se il livello è inferiore a quello configurato
    if (level < this.minLevel) return;
    
    // Sanitizza i dati sensibili prima di loggarli
    const sanitizedData = data ? this.sanitize(data) : undefined;
    
    switch (level) {
      case LogLevel.Debug:
        console.debug(`[${component}] ${message}`, sanitizedData);
        break;
      case LogLevel.Info:
        console.info(`[${component}] ${message}`, sanitizedData);
        break;
      case LogLevel.Warn:
        console.warn(`[${component}] ${message}`, sanitizedData);
        break;
      case LogLevel.Error:
        console.error(`[${component}] ${message}`, sanitizedData);
        break;
    }
  }
  
  private sanitize(data: any): any {
    // Se è una stringa
    if (typeof data === 'string') {
      // Verifica se contiene dati sensibili
      for (const pattern of this.sensitiveDataPatterns) {
        if (pattern.test(data)) {
          return '[CONTENUTO RISERVATO]';
        }
      }
      return data;
    }
    
    // Se è un oggetto, processa ricorsivamente
    if (data && typeof data === 'object') {
      const result: any = Array.isArray(data) ? [] : {} as Record<string, any>;
      
      for (const key in data) {
        // Salta proprietà sensibili note
        if (key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret')) {
          result[key] = '[RISERVATO]';
          continue;
        }
        
        // Sanitizza ricorsivamente
        result[key] = this.sanitize(data[key]);
      }
      return result;
    }
    
    // Per i tipi primitivi, ritorna il valore originale
    return data;
  }
  
  private sanitizeError(error: any): any {
    if (!error) return undefined;
    
    // Per gli errori HTTP
    if (error.error && error.status) {
      return {
        status: error.status,
        statusText: error.statusText,
        message: this.sanitize(error.error.message || error.message)
      };
    }
    
    // Per gli errori standard
    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitize(error.message)
      };
    }
    
    // Per altri tipi di errore
    return this.sanitize(error);
  }
}
