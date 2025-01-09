import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Category } from '../models/category_model';
import { ShowPost } from '../models/showpost_model'; // Add this line
import { DetailPost } from '../models/detail_post';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend
  public posts: ShowPost[] = []; // Declare the posts property

  constructor(private http: HttpClient) { }


  addPost(formData: FormData): Observable<any> {
    // Retrieve the JWT token from localStorage
    const token = localStorage.getItem('token');


    if (!token) {
      console.error('No token found, user not authenticated');
      return throwError('No token found, user not authenticated');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post(`${this.baseUrl}/posts/addPost`, formData, { headers });
  }


  getCategories(): Observable<Category[]> {
    // ดึง JWT token จาก localStorage หรือ sessionStorage
    const token = localStorage.getItem('token');  // JWT Token ที่ได้จากการล็อกอิน

    // ตรวจสอบว่า token มีค่าไหม
    if (!token) {
      throw new Error('Token not found!');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Category[]>(`${this.baseUrl}/categories/namecat`, { headers });
  }

  // ดึงข้อมูลโพสต์ทั้งหมด
  getPosts(): Observable<ShowPost[]> {
    // ดึง JWT และ uid จาก localStorage
    const token = localStorage.getItem('token');  // JWT Token
    const uid = localStorage.getItem('userId');   // uid ของผู้ใช้ที่ล็อกอิน
  
    if (!token || !uid) {
      return throwError('Token or UserId not found'); // ถ้าไม่มี Token หรือ uid ให้โยน error
    }
  
    // ตรวจสอบค่าของ token และ uid
    console.log(localStorage.getItem('token'));
    console.log(localStorage.getItem('userId'));
  
    // สร้าง HttpHeaders ที่มี Authorization: Bearer <JWT-TOKEN>
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('uid', uid || '');  // ส่ง uid ของผู้ใช้ใน header
  
    // ส่งคำขอ GET ไปที่ API พร้อม Token และ uid
    return this.http.get<ShowPost[]>(`${this.baseUrl}/posts/getPosts`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);  // ตรวจสอบข้อมูลที่ได้รับจาก API
  
      })
    );
  }

  getPostById(postId: number): Observable<DetailPost> {
    const token = localStorage.getItem('token');  // JWT Token
    const uid = localStorage.getItem('userId');   // uid ของผู้ใช้ที่ล็อกอิน

    // ตรวจสอบว่า JWT และ uid มีค่าไหม
    if (!token || !uid) {
      console.error('JWT token or user ID not found in localStorage');
      throw new Error('Unauthorized: Missing token or user ID');
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('uid', uid || '');  // ส่ง uid ของผู้ใช้ใน header

    // ส่งคำขอ GET ไปที่ API พร้อม Token และ uid
    return this.http.get<DetailPost>(`${this.baseUrl}/posts/getPost/${postId}`, { headers });
  }

}
