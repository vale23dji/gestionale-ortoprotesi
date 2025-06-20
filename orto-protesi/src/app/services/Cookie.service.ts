import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private readonly documentIsAccessible: boolean;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.documentIsAccessible = isPlatformBrowser(this.platformId);
  }

  setCookie(name: string, value: string, options: {
    expires?: number;
    path?: string;
    sameSite?: 'Strict' | 'Lax' | 'None';
    secure?: boolean;
    httpOnly?: boolean;
  } = {}): void {
    if (!this.documentIsAccessible) {
      return;
    }

    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      const date = new Date();
      date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
      cookieStr += `;expires=${date.toUTCString()}`;
    }

    if (options.path) {
      cookieStr += `;path=${options.path}`;
    }

    if (options.sameSite) {
      cookieStr += `;SameSite=${options.sameSite}`;
    } else {
      cookieStr += `;SameSite=Lax`;
    }

    if (options.secure) {
      cookieStr += ';Secure';
    }

    if (options.httpOnly) {
      cookieStr += ';HttpOnly';
    }

    this.document.cookie = cookieStr;
  }

  getCookie(name: string): string {
    if (!this.documentIsAccessible) {
      return '';
    }

    const regExp = new RegExp(`(?:^|;\\s*)${encodeURIComponent(name)}=([^;]*)`);
    const result = regExp.exec(this.document.cookie);

    return result ? decodeURIComponent(result[1]) : '';
  }

  deleteCookie(name: string, path: string = '/'): void {
    if (!this.documentIsAccessible) {
      return;
    }

    this.document.cookie = `${encodeURIComponent(name)}=;path=${path};expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  hasKey(name: string): boolean {
    if (!this.documentIsAccessible) {
      return false;
    }

    const regExp = new RegExp(`(?:^|;\\s*)${encodeURIComponent(name)}=([^;]*)`);
    return regExp.test(this.document.cookie);
  }

  getAll(): { [key: string]: string } {
    if (!this.documentIsAccessible) {
      return {};
    }

    const cookies: { [key: string]: string } = {};
    const cookiesArr = this.document.cookie.split(';');

    for (const cookie of cookiesArr) {
      const cookiePair = cookie.split('=');
      if (cookiePair[0].trim()) {
        cookies[decodeURIComponent(cookiePair[0].trim())] = decodeURIComponent(cookiePair[1] || '');
      }
    }

    return cookies;
  }
}
