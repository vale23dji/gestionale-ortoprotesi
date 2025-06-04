import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { StorageService } from '../services/storage.service';
import { DebugService } from '../services/debug.service';

export const RoleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot) => {
    const router = inject(Router);
    const storage = inject(StorageService);
    const debug = inject(DebugService);

    const GUARD_NAME = 'RoleGuard';
    const currentUrl = route.url.map(segment => segment.path).join('/');

    debug.debug(GUARD_NAME, `Verifica ruoli autorizzati [${allowedRoles.join(', ')}] per: ${currentUrl}`);

    const token = storage.getItem('token');
    if (!token) {
      debug.warn(GUARD_NAME, `Accesso negato a ${currentUrl}: token non trovato`);
      router.navigate(['/login']);
      return false;
    }

    try {
      const decoded = jwtDecode<any>(token);
      const userRole = (decoded.role as string || '').toLowerCase();

      debug.debug(GUARD_NAME, `Verifica ruolo: ${userRole} vs consentiti: [${allowedRoles.join(', ')}]`);

      // Verifica che il ruolo dell'utente sia tra quelli consentiti
      if (allowedRoles.some(role => role.toLowerCase() === userRole)) {
        debug.info(GUARD_NAME, `Accesso autorizzato a ${currentUrl} per utente con ruolo: ${userRole}`);
        return true;
      }

      // Se l'utente non ha accesso, reindirizza in base al ruolo
      debug.warn(GUARD_NAME, `Accesso negato a ${currentUrl}: ruolo ${userRole} non autorizzato`, {
        ruoloUtente: userRole,
        ruoliConsentiti: allowedRoles
      });

      if (userRole === 'admin') {
        router.navigate(['/dashboard']);
      } else if (userRole === 'medico') {
        router.navigate(['/mie-lavorazioni']);
      } else {
        router.navigate(['/accesso-negato']);
      }

      return false;

    } catch (error) {
      debug.error(GUARD_NAME, `Errore nella validazione del ruolo per: ${currentUrl}`, error);

      router.navigate(['/login']);
      return false;
    }
  };
};
