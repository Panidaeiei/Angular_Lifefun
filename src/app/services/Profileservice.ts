import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // ดึงข้อมูลผู้ใช้
  getUserProfile(): Observable<User> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // ส่ง JWT Token ใน Header
    });

    return this.http
      .get<User>(`${this.baseUrl}/profile/me`, { headers }) // เรียก API /profile/me
      .pipe(
        catchError((error) => {
          console.error('Error fetching user profile:', error);
          return throwError(error);
        })
      );
  }

  getPostsMe(): Observable<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });

    return this.http
      .get<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }>(
        `${this.baseUrl}/profile/posts_me`,
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching posts:', error);
          return throwError(error);
        })
      );
  }

  getUserProfileById(userId: string): Observable<User> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // ใส่ JWT Token
    });

    return this.http
      .get<User>(`${this.baseUrl}/profile/Prouser/${userId}`, { headers })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching profile for user ${userId}:`, error);
          return throwError(error);
        })
      );
  }

  getUserPostsById(userId: string): Observable<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // ส่ง JWT Token ใน Header
    });

    return this.http
      .get<{ userPosts: Postme[]; savedPosts: Postme[]; sharedPosts: Postme[] }>(
        `${this.baseUrl}/profile/posts_user/${userId}`,  // ดึงข้อมูลจาก URL `/posts_user/:uid`
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching posts:', error);
          return throwError(error);
        })
      );
  }


}

