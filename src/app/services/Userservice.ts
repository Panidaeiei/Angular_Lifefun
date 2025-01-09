import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { User } from '../models/register_model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend

  constructor(private http: HttpClient) { }


  // ดึงข้อมูลผู้ดูแลระบบ
  getAdmins(): Observable<any> {
    return this.http.get(`${this.baseUrl}/view_admin`); // แก้พิมพ์ผิด
  }

  // ดึงข้อมูลผู้ใช้
  getUserById(userId: string): Observable<User> {
    const token = localStorage.getItem('token'); 
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized'));
    }
  
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`); 
  
    return this.http.get<User>(`${this.baseUrl}/view_users/${userId}`, { headers });
  }
  

  // ลงทะเบียนผู้ใช้
  registerUser(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, formData);
  }


  // เข้าสู่ระบบ
  login(data: { email?: string; username?: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

}
