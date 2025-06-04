import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { StorageService } from '../services/storage.service';
import { DebugService } from '../services/debug.service';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const storage = inject(StorageService);
  const debug = inject(DebugService);

  const GUARD_NAME = 'AuthGuard';
  const currentUrl = route.url.map(segment => segment.path).join('/');

  debug.debug(GUARD_NAME, `Verifica autorizzazione per: ${currentUrl}`);

  const token = storage.getItem('token');
  if (!token) {
    debug.warn(GUARD_NAME, `Accesso negato a ${currentUrl}: token non trovato`);

    // Salva l'URL corrente per reindirizzare dopo il login
    router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
    return false;
  }

  try {
    // Decodifica il token e verifica la scadenza
    const decoded = jwtDecode<any>(token);
    const now = Date.now() / 1000;

    if (decoded.exp && decoded.exp < now) {
      debug.warn(GUARD_NAME, 'Token scaduto, necessario nuovo login', {
        expirationTime: new Date(decoded.exp * 1000).toISOString(),
        currentTime: new Date().toISOString()
      });

      storage.removeItem('token');
      storage.removeItem('utente');
      router.navigate(['/login']);
      return false;
    }

    const ruoloJwt = decoded.role as string;
    const ruoloRichiesto = (route.data['ruolo'] as string | undefined)?.toLowerCase();

    debug.debug(GUARD_NAME, `Verifica ruolo: ${ruoloJwt} vs richiesto: ${ruoloRichiesto || 'non specificato'}`);

    if (ruoloRichiesto && ruoloJwt.toLowerCase() !== ruoloRichiesto.toLowerCase()) {
      // Se l'utente è autenticato ma non ha il ruolo giusto, reindirizzalo alla pagina appropriata
      debug.warn(GUARD_NAME, `Accesso negato a ${currentUrl}: ruolo non autorizzato`, {
        ruoloUtente: ruoloJwt,
        ruoloRichiesto
      });

      if (ruoloJwt.toLowerCase() === 'admin') {
        router.navigate(['/dashboard']);
      } else if (ruoloJwt.toLowerCase() === 'medico') {
        router.navigate(['/mie-lavorazioni']);
      } else {
        router.navigate(['/accesso-negato']);
      }
      return false;
    }

    debug.info(GUARD_NAME, `Accesso autorizzato a ${currentUrl} per utente con ruolo: ${ruoloJwt}`);
    return true;

  } catch (error) {
    debug.error(GUARD_NAME, `Errore nella validazione del token per: ${currentUrl}`, error);

    storage.removeItem('token');
    storage.removeItem('utente');
    router.navigate(['/login']);
    return false;
  }
};
