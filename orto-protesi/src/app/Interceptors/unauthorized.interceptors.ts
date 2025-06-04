import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthServiceService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Intercetta errori 401 Unauthorized
      if (error.status === 401) {
        console.log('==== UNAUTHORIZED REQUEST DETECTED ====');
        console.log('- Clearing auth data and redirecting to login');
        
        // Cancella dati auth e notifica il cambiamento
        authService.logout();
        
        // Reindirizza al login
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};
