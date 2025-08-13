import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Category } from '../models/category_model';
import { ShowPost } from '../models/showpost_model'; // Add this line
import { DetailPost } from '../models/detail_post';
import { environment } from '../../environments/environment';
import { EditPostModel } from '../models/edit-post.model';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend
  public posts: ShowPost[] = []; // Declare the posts property

  constructor(private http: HttpClient, private router: Router) { }

  getViewCounts(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/posts/getviwepost`);
  }

  addPost(formData: FormData): Observable<any> {
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
    const token = localStorage.getItem('token');

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

    const uid = localStorage.getItem('userId');   // uid ของผู้ใช้ที่ล็อกอิน

    // สร้าง HttpHeaders ที่มี Authorization: Bearer <JWT-TOKEN>
    const headers = new HttpHeaders()
      .set('uid', uid || '');  // ส่ง uid ของผู้ใช้ใน header

    // ส่งคำขอ GET ไปที่ API พร้อม Token และ uid
    return this.http.get<ShowPost[]>(`${this.baseUrl}/posts/getPosts`, { headers }).pipe(
      tap((response) => {
        // ตรวจสอบข้อมูลที่ได้รับจาก API
      })
    );
  }

  getPosts_interests(): Observable<ShowPost[]> {
    // ดึง JWT และ uid จาก localStorage
    const token = localStorage.getItem('token');
    const uid = localStorage.getItem('userId');

    if (!token || !uid) {
      return throwError('Token or UserId not found'); // ถ้าไม่มี Token หรือ uid ให้โยน error
    }

    // สร้าง HttpHeaders ที่มี Authorization: Bearer <JWT-TOKEN>
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('uid', uid || '');  // ส่ง uid ของผู้ใช้ใน header

    // ส่งคำขอ GET ไปที่ API พร้อม Token และ uid
    return this.http.get<ShowPost[]>(`${this.baseUrl}/posts/getPosts_interests`, { headers }).pipe(
      tap((response) => {
        // ตรวจสอบข้อมูลที่ได้รับจาก API
      })
    );
  }

  getPostsFollowing(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');  // ส่ง uid ของผู้ใช้ใน header

    // ส่งคำขอ GET ไปที่ API พร้อม Token และ uid
    return this.http.get<ShowPost[]>(`${this.baseUrl}/posts/getFollowingPosts`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);  // ตรวจสอบข้อมูลที่ได้รับจาก API

      })
    );
  }

  getPostById(postId: number): Observable<DetailPost> {
    const token = localStorage.getItem('token'); // JWT Token
    const uid = localStorage.getItem('userId'); // uid ของผู้ใช้ที่ล็อกอิน

    // ตรวจสอบว่า JWT และ uid มีค่า
    if (!token || !uid) {
      console.error('JWT token or user ID not found in localStorage');
      return throwError(() => new Error('Unauthorized: Missing token or user ID'));
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('uid', uid); // ส่ง uid ของผู้ใช้ใน header

    // ส่งคำขอ GET ไปที่ API พร้อม Token และ uid
    return this.http.get<DetailPost>(`${this.baseUrl}/posts/getPost/${postId}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error fetching post:', error);
        return throwError(() => new Error('Failed to fetch post.'));
      })
    );
  }

  // ฟังก์ชันสำหรับลบโพสต์
  deletePost(postId: number): Observable<any> {
    const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const token = adminToken || userToken; // ใช้ admin token ก่อน ถ้าไม่มีค่อยใช้ user token

    // ตรวจสอบว่า JWT token มีค่าไหม
    if (!token) {
      console.error('JWT token not found in localStorage');
      return throwError(() => new Error('Unauthorized: Missing token'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`  // ส่ง JWT token
    });

    console.log('Using token type:', adminToken ? 'adminToken' : 'userToken');
    // ส่งคำขอลบโพสต์ไปยัง Backend
    return this.http.delete(`${this.baseUrl}/posts/deletePost/${postId}`, { headers });
  }

  editPost(postId: number, editData: EditPostModel): Observable<any> {
    const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const token = adminToken || userToken; // ใช้ admin token ก่อน ถ้าไม่มีค่อยใช้ user token

    if (!token) {
      console.error('JWT token not found in localStorage');
      return throwError(() => new Error('Unauthorized: Missing token'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,  // ส่ง JWT token ใน header
    });

    console.log('Using token type:', adminToken ? 'adminToken' : 'userToken');
    // ส่งคำขอ PUT ไปที่ API เพื่อแก้ไขโพสต์
    return this.http.put(`${this.baseUrl}/posts/editPost/${postId}`, editData, { headers });
  }


  // profile.service.ts
  viewPost(postId: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
    return this.http
      .post<any>(`${this.baseUrl}/posts/viewPost/${postId}`, {}, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error updating view count:', error);
          return throwError(error);
        })
      );
  }

  searchPosts(searchTerm: string): Observable<ShowPost[]> {
    return this.http.get<ShowPost[]>(`${this.baseUrl}/posts/s_getPosts?search=${encodeURIComponent(searchTerm)}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching search results:', error);
          return throwError(() => new Error(error.message || 'Failed to fetch posts'));
        })
      );
  }



  getPostsCosmetics(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');

    return this.http.get<ShowPost[]>(`${this.baseUrl}/categories/getPosts/Cosmetics`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);

      })
    );
  }

  getPostsFashion(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');

    return this.http.get<ShowPost[]>(`${this.baseUrl}/categories/getPosts/Fashion`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);

      })
    );
  }

  getPostsSkincare(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');

    return this.http.get<ShowPost[]>(`${this.baseUrl}/categories/getPosts/Skincare`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);

      })
    );
  }

  getPostsFood(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');

    return this.http.get<ShowPost[]>(`${this.baseUrl}/categories/getPosts/Food`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);

      })
    );
  }
  
  getPostsHealth(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');

    return this.http.get<ShowPost[]>(`${this.baseUrl}/categories/getPosts/Health`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);

      })
    );
  }

  getPostsTravel(): Observable<ShowPost[]> {
    const uid = localStorage.getItem('userId');

    console.log(localStorage.getItem('userId'));

    const headers = new HttpHeaders()
      .set('uid', uid || '');

    return this.http.get<ShowPost[]>(`${this.baseUrl}/categories/getPosts/Travel`, { headers }).pipe(
      tap((response) => {
        console.log('Response from API:', response);

      })
    );
  }

  getPostsByCategory(cat_id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/categories/getPosts/${cat_id}`);
  }

   getPostMain(postId: string): Observable<DetailPost[]> {
    return this.http.get<any>(`${this.baseUrl}/posts/getPostmain/${postId}`);
  }

  addComment(postId: string, comment: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found!');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.baseUrl}/posts/${postId}/comments`, { comment }, { headers });
  }
}
