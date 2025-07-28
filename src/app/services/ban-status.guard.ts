import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from './Userservice'; // ปรับ path ให้ตรงกับของคุณ
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BanStatusGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(): Observable<boolean> {
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    if (role === 'admin') {
      // ถ้าเป็น admin ไม่ต้องเช็คสถานะ
      return of(true);
    }
    return this.userService.getCurrentUser().pipe(
      map(user => {
        if (user && user.status === 0) {
          alert('บัญชีของคุณถูกระงับการใช้งาน');
          localStorage.clear();
          sessionStorage.clear();
          this.router.navigate(['/login']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}