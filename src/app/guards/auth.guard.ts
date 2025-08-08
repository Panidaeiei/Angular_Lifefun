// src/app/guards/auth.guard.ts
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const auth   = inject(AuthService);

  const ok = auth.isTokenValid();
  console.log('[authGuard]', state.url, 'validToken =', ok);

  if (!ok) {
    auth.logout();
    router.navigate(['/login'], { queryParams: { redirect: state.url } });
    return false;
  }
  return true;
};
