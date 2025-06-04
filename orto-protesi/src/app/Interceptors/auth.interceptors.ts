import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const token = storage.getItem('token');

  console.log('Interceptor: URL chiamata:', req.url);
  console.log('Interceptor: Token:', !!token);


  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Interceptor: Token aggiunto alla richiesta:');
    return next(authReq);
  }
  console.log('Interceptor: Richiesta senza token.');
  return next(req);
};
