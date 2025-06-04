import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(StorageService).getItem('token');
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authReq);
};
