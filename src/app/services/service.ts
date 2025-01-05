import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/register_model';
import { Post } from '../models/post_model';
import { Category } from '../models/category_model';
import { ShowPost } from '../models/showpost_model'; // Add this line


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:3000/api'; // URL ของ Backend

  constructor(private http: HttpClient) { }


  // ดึงข้อมูลผู้ดูแลระบบ
  getAdmins(): Observable<any> {
    return this.http.get(`${this.baseUrl}/view_admin`); // แก้พิมพ์ผิด
  }

  // ดึงข้อมูลผู้ใช้
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/view_users/${userId}`);
  }

  // ลงทะเบียนผู้ใช้
  registerUser(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, formData);
  }


  // เข้าสู่ระบบ
  login(data: { email?: string; username?: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  addPost(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/posts/addPost`, formData);
  }

  getCategories(): Observable<Category[]> { // Explicitly specify the type
    return this.http.get<Category[]>(`${this.baseUrl}/categories/namecat`);
  }

  // ดึงข้อมูลโพสต์ทั้งหมด
  getPosts(): Observable<ShowPost[]> {
    return this.http.get<ShowPost[]>(`${this.baseUrl}/posts/getPosts`);
  }

}
