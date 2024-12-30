import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/register_model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:3000/api'; // URL ของ Backend

  constructor(private http: HttpClient) {}


  // ดึงข้อมูลผู้ดูแลระบบ
  getAdmins(): Observable<any> {
    return this.http.get(`${this.baseUrl}/viwe_admin`);
  }

  // ดึงข้อมูลผู้ใช้
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/viwe_users`);
  }

  // ลงทะเบียนผู้ใช้
  registerUser(user: User): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, user);
  }

  // เข้าสู่ระบบ
  login(data: { email?: string; username?: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

}
