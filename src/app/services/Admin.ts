import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Ban } from '../models/ban.model';
import { User } from '../models/register_model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend

  constructor(private http: HttpClient) { }

  // ฟังก์ชันระงับบัญชีผู้ใช้
  banUser(uid: number, reason: string, end_date: string): Observable<Ban> {
    const token =
      localStorage.getItem('adminToken') ||
      sessionStorage.getItem('adminToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please login again.');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    const body = { uid, reason, end_date };
    return this.http.post<Ban>(`${this.baseUrl}/admin/ban`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }
  // ฟังก์ชันยกเลิกการระงับบัญชีผู้ใช้
  unbanUser(uid: number): Observable<Ban> {
    const token =
      localStorage.getItem('adminToken') ||
      sessionStorage.getItem('adminToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please login again.');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
    const body = { uid };
    return this.http.post<Ban>(`${this.baseUrl}/admin/unban`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ฟังก์ชันจัดการข้อผิดพลาด
  private handleError(error: any): Observable<never> {
    let errorMessage = 'เกิดข้อผิดพลาด';
    
    if (error.status === 401) {
      console.error('Token หมดอายุหรือไม่ถูกต้อง');
      // ล้างข้อมูล session
      localStorage.clear();
      sessionStorage.clear();
      // redirect ไปหน้า login
      window.location.href = '/';
      errorMessage = 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
    } else if (error.error instanceof ErrorEvent) {
      // Error จาก Client-side
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error จาก Server-side
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('Admin Service Error:', error);
    return throwError(errorMessage);
  }

  searchBanUsers(username: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/admin/search_banuser`, { params: { username } });
  }

  // Admin Profile Methods
  getAdminUserProfileById(userId: string): Observable<any> {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!adminToken) {
      return throwError(() => new Error('Admin token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    });

    // ใช้ API route เดิม
    return this.http.get(`${this.baseUrl}/profile/Prouser/${userId}`, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getAdminUserPostsById(userId: string): Observable<any> {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!adminToken) {
      return throwError(() => new Error('Admin token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.baseUrl}/profile/posts_user/${userId}`, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  getAdminFollowCount(userId: string): Observable<any> {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!adminToken) {
      return throwError(() => new Error('Admin token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.baseUrl}/follows/follow-count?userId=${userId}`, { headers }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

}

