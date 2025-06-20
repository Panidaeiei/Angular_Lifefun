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
    const token = localStorage.getItem('token'); // สมมติว่าคุณเก็บ token ไว้ใน localStorage หรือ sessionStorage
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`, // ส่ง token ใน Header
    });
    const body = { uid, reason, end_date };
    return this.http.post<Ban>(`${this.baseUrl}/admin/ban`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ฟังก์ชันยกเลิกการระงับบัญชีผู้ใช้
  unbanUser(uid: number): Observable<Ban> {
    const token = localStorage.getItem('token'); // สมมติว่าคุณเก็บ token ไว้ใน localStorage หรือ sessionStorage
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`, // ส่ง token ใน Header
    });
    const body = { uid };
    return this.http.post<Ban>(`${this.baseUrl}/admin/unban`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ฟังก์ชันจัดการข้อผิดพลาด
  private handleError(error: any): Observable<never> {
    let errorMessage = 'เกิดข้อผิดพลาด';
    if (error.error instanceof ErrorEvent) {
      // Error จาก Client-side
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error จาก Server-side
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  searchBanUsers(username: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/admin/search_banuser`, { params: { username } });
  }

}

