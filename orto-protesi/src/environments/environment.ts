/**
 * Questo file contiene le variabili di ambiente per lo sviluppo locale.
 * Utilizziamo queste variabili durante il testing e lo sviluppo.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:5233/api',
  uploadUrl: 'http://localhost:5233/uploads',
  jwtExpirationDate: 3600, // 1 ora
};
 */

// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '/api',
  uploadUrl: '/uploads',
  jwtExpirationDate: 3600,
};

