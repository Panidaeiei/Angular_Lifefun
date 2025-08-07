import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, throwError } from 'rxjs';
import { User } from '../models/register_model';
import { environment } from '../../environments/environment';
import { SearchUser } from '../models/search-user.model';

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

  getCurrentUser(): Observable<User> {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('No userId found'));
    }
    return this.getUserById(userId);
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

  getUsers(): Observable<User[]> {
    // ดึง token ตาม role
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const token = adminToken || userToken;
    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<User[]>(`${this.baseUrl}/view_users`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch users'));
      })
    );
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

    // Debug: แสดงข้อมูลที่ส่งไป
    console.log('📤 Sending FormData to backend:');
    formData.forEach((value, key) => {
      console.log(`📤 ${key}:`, value);
    });

    return this.http.put(`${this.baseUrl}/edit_user`, formData, { headers, responseType: 'json' }).pipe(
      tap((response) => {
        console.log('📥 Raw response from backend:', response);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error in updateUser:', error);
        console.log('📌 Error status:', error.status);
        console.log('📌 Error statusText:', error.statusText);
        console.log('📌 Full raw error response:', error);
        console.log('📌 Parsed error object:', error.error);

        // ถ้า error.error มีค่าให้ใช้มัน ถ้าไม่มีให้ใช้ error เอง
        return throwError(() => new Error(JSON.stringify(error.error || error)));
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

  searchUsers(username: string): Observable<SearchUser[]> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage or SessionStorage'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<SearchUser[]>(`${this.baseUrl}/search_user?username=${username}`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching searched users:', error);
        return throwError(() => new Error(error.message || 'Failed to search users'));
      })
    );
  }

}
