import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { User } from '../models/register_model';
import { environment } from '../../environments/environment';
import { EditUser } from '../models/edit-user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend

  constructor(private http: HttpClient) { }

  private currentUserIdSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  setCurrentUserId(userId: string): void {
    this.currentUserIdSubject.next(userId); // อัปเดตค่าใน BehaviorSubject
    localStorage.setItem('currentUserId', userId); // เก็บค่าใน LocalStorage
  }

  getCurrentUserId(): Observable<string | null> {
    return this.currentUserIdSubject.asObservable();
  }

  loadCurrentUserId(): void {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      this.currentUserIdSubject.next(storedUserId); // ตั้งค่าใน BehaviorSubject
    }
  }

  logout(): void {
    this.currentUserIdSubject.next(null); // ล้างค่าใน BehaviorSubject
    localStorage.removeItem('currentUserId'); // ลบค่าใน LocalStorage
    localStorage.removeItem('token'); // ลบ Token
  }

  // ดึงข้อมูลผู้ดูแลระบบ
  getAdmins(): Observable<any> {
    return this.http.get(`${this.baseUrl}/view_admin`);
  }

  // ดึงข้อมูลผู้ใช้
  getUserById(userId: string): Observable<User> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<User>(`${this.baseUrl}/view_users/${userId}`, { headers });
  }

  // ลงทะเบียนผู้ใช้
  registerUser(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, formData);
  }

  // เข้าสู่ระบบ
  login(data: { email?: string; username?: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data).pipe(
      tap((response: any) => {
        if (response && response.userId) {
          this.setCurrentUserId(response.userId); // อัปเดตค่า currentUserId
          localStorage.setItem('token', response.token); // เก็บ Token ลง LocalStorage
          console.log('Login successful, User ID set:', response.userId);
        } else {
          console.warn('Login response does not include userId');
        }
      }),
      catchError((error) => {
        console.error('Login failed:', error);
        return throwError(() => new Error(error.message));
      })
    );
  }
  

  // อัปเดตข้อมูลผู้ใช้
  updateUser(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.put(`${this.baseUrl}/edit_user`, formData, { headers }).pipe(
      catchError((error) => {
        console.error('Error in updateUser:', error);
        return throwError(() => new Error(error.message));
      })
    );
  }

  // ลบผู้ใช้
  deleteUser(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const url = `${this.baseUrl}/deleteUser/${userId}`;
    return this.http.delete(url, { headers }).pipe(
      catchError((error) => {
        console.error('Error in deleteUser:', error);
        return throwError(() => new Error(error.message));
      })
    );
  }
}
