import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/register_model';
import { Postme } from '../models/postme_model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private baseUrl = environment.apiBaseUrl; // URL ของ API Node.js

  constructor(private http: HttpClient) { }

  // ฟังก์ชันสำหรับสร้าง headers พร้อม token
  private getHeaders(): HttpHeaders {
    // ตรวจสอบ token จากหลายแหล่ง (user token และ admin token)
    const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');

    const token = adminToken || userToken; // ใช้ adminToken ก่อน ถ้าไม่มีค่อยใช้ userToken

    if (!token) {
      throw new Error('Token not found');
    }

    console.log('Using token type:', adminToken ? 'adminToken' : 'userToken');

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ฟังก์ชันสำหรับจัดการ error
  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);

    if (error.status === 401) {
      console.error('Token หมดอายุหรือไม่ถูกต้อง');

      // ตรวจสอบว่าเป็น admin หรือไม่
      const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      const adminId = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');

      if (adminToken && adminId) {
        console.log('Admin detected, not clearing storage');
        return throwError('Admin token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      } else {
        console.log('User detected, clearing storage');
        // ล้างข้อมูล session เฉพาะ user
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('userId');
        return throwError('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
      }
    }

    return throwError(error);
  }

  // ดึงข้อมูลผู้ใช้
  getUserProfile(): Observable<User> {
    try {
      const headers = this.getHeaders();

      return this.http
        .get<User>(`${this.baseUrl}/profile/me`, { headers })
        .pipe(
          catchError(this.handleError.bind(this))
        );
    } catch (error) {
      return throwError(error);
    }
  }

  getPostsMe(): Observable<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }> {
    try {
      const headers = this.getHeaders();

      return this.http
        .get<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }>(
          `${this.baseUrl}/profile/posts_me`,
          { headers }
        )
        .pipe(
          catchError(this.handleError.bind(this))
        );
    } catch (error) {
      return throwError(error);
    }
  }

  getUserProfileById(userId: string): Observable<User> {
    try {
      const headers = this.getHeaders();

      return this.http
        .get<User>(`${this.baseUrl}/profile/Prouser/${userId}`, { headers })
        .pipe(
          catchError(this.handleError.bind(this))
        );
    } catch (error) {
      return throwError(error);
    }
  }

  getUserPostsById(userId: string): Observable<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }> {
    try {
      const headers = this.getHeaders();

      return this.http
        .get<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }>(
          `${this.baseUrl}/profile/posts_user/${userId}`,
          { headers }
        )
        .pipe(
          catchError(this.handleError.bind(this))
        );
    } catch (error) {
      return throwError(error);
    }
  }
}

