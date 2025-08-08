// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  get token(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  // เช็คว่า token มีจริง + ยังไม่หมดอายุ
  isTokenValid(): boolean {
    const t = this.token;
    if (!t) return false;
    const parts = t.split('.');
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(atob(parts[1]));
      if (!payload?.exp) return false;
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    const keys = ['token','userId','userRole','currentUserId','adminId','adminRole','adminToken'];
    keys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  }
}
