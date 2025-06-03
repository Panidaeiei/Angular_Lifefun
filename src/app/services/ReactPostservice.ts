import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LikePost } from '../models/LikePost_model';
import { Comment } from '../models/comment_model';
import { SharePostModel } from '../models/sharepost_model';
import { SavePostModel } from '../models/savepost_service';
import { Follow, FollowCount, FollowStatus } from '../models/follow.model';

@Injectable({
  providedIn: 'root',
})
export class ReactPostservice {
  private baseUrl = environment.apiBaseUrl;  // URL ของ API ที่ทำงานใน Node.js

  // ใช้ BehaviorSubject สำหรับติดตามสถานะไลค์
  public likeStatusSubject = new BehaviorSubject<boolean>(false);
  likeStatus$ = this.likeStatusSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ฟังก์ชันในการกดไลค์
  likePost(postId: number, userId: number): Observable<any> {
    const token = localStorage.getItem('token');  // ดึง JWT Token จาก localStorage

    // ตรวจสอบว่า token มีค่าหรือไม่
    if (!token) {
      return throwError('Unauthorized: No token found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const likePost: LikePost = {
      post_id: postId,
      uid: userId,  // ID ของผู้ใช้ที่กำลังไลค์โพสต์
      date_time: new Date().toISOString(),  // Add current date and time
      notify: 0,
    };

    return this.http.post(`${this.baseUrl}/likepost/like`, likePost, { headers }).pipe(
      // เมื่อทำการไลค์โพสต์, เราจะเปลี่ยนแปลงสถานะของไลค์
      tap((response: any) => {
        if (response.isLiked !== undefined) {
          this.likeStatusSubject.next(response.isLiked); // อัปเดตสถานะการไลค์ใน BehaviorSubject
        }
      })
    );
  }

  // ฟังก์ชันในการตรวจสอบสถานะไลค์
  checkLikeStatus(postId: number): Observable<any> {
    const token = localStorage.getItem('token');  // ดึง JWT Token จาก localStorage

    // ตรวจสอบว่า token มีค่าหรือไม่
    if (!token) {
      return throwError('Unauthorized: No token found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // ส่ง HTTP GET request ไปที่ API ที่ตรวจสอบสถานะไลค์
    return this.http.get(`${this.baseUrl}/likepost/check-like-status?post_id=${postId}`, { headers }).pipe(
      tap((response: any) => {
        // ใช้ข้อมูลที่ได้รับจาก API เพื่อตรวจสอบว่าไลค์หรือไม่
        this.likeStatusSubject.next(response.liked);
      })
    );
  }

  addComment(postId: number, title: string, userId: number): Observable<any> {
    const token = localStorage.getItem('token');  // ดึง JWT Token จาก localStorage

    if (!token) {
      return throwError('Unauthorized: No token found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);  // เพิ่ม token ใน header

    const comment: Comment = {
      post_id: postId,
      title: title,
      uid: userId,
      date_time: new Date().toISOString(),
      notify: 0,
      username: '',
      image_url: '',
    };
    console.log('เพิ่มความคิดเห็นเรียบร้อย');
    return this.http.post(`${this.baseUrl}/comments/add-comment`, comment, { headers });

  }

  getComments(postId: number): Observable<any> {
    const token = localStorage.getItem('token');  // ดึง JWT Token จาก localStorage

    if (!token) {
      return throwError('Unauthorized: No token found');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    return this.http.get(`${this.baseUrl}/comments/comment?post_id=${postId}`, { headers });
  }

  deleteComment(commentId: string): Observable<any> {
    const token = localStorage.getItem('token'); // รับ token จาก localStorage

    if (!token) {
      console.error('No token found');
      throw new Error('Unauthorized');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.delete(`${this.baseUrl}/comments/Decomment?comment_id=${commentId}`, { headers });
  }

  sharePost(post: SharePostModel): Observable<any> {
    const token = localStorage.getItem('token'); // JWT Token
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // ส่งคำขอ POST พร้อมข้อมูล SharePostModel
    return this.http.post(`${this.baseUrl}/sharepost/share-or-unshare`, post, { headers }).pipe(
      tap((response) => {
        console.log('Response :', response); // Log response ที่ได้จาก API
      }),
      catchError((error) => {
        console.error('API Error:', error); // Log กรณีเกิดข้อผิดพลาด
        return throwError(error); // ส่งข้อผิดพลาดกลับไป
      })
    );
  }

  getShareStatus(data: SharePostModel): Observable<{ isShared: boolean }> {
    const token = localStorage.getItem('token'); // JWT Token
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<{ isShared: boolean }>(
      `${this.baseUrl}/sharepost/get-status`,
      data, // ส่ง object SharePostModel
      { headers }
    );
  }

  saveOrUnsavePost(data: SavePostModel): Observable<{ message: string; isSave: boolean }> {
    const token = localStorage.getItem('token'); // JWT Token
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<{ message: string; isSave: boolean }>(
      `${this.baseUrl}/savepost/save`,
      data,
      { headers }).pipe(
        tap((response) => {
          console.log('Response save:', response); // Log response ที่ได้จาก API
        }),
        catchError((error) => {
          console.error('API Error:', error); // Log กรณีเกิดข้อผิดพลาด
          return throwError(error); // ส่งข้อผิดพลาดกลับไป
        })
      );
  }

  getSaveStatus(post_id: number): Observable<{ isSave: boolean }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<{ isSave: boolean }>(
      `${this.baseUrl}/savepost/get-save-status`,
      { post_id },
      { headers }
    );
  }

  toggleFollow(follow: Follow): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,  // ส่ง JWT token ใน header
      'Content-Type': 'application/json'  // กำหนด Content-Type ให้ถูกต้อง
    });

    return this.http.post(
      `${this.baseUrl}/follows/toggle-follow`,
      follow,  // ส่งข้อมูลแบบ Follow model
      { headers }
    );
  }

  checkFollowStatus(following_id: string, followed_id: string): Observable<FollowStatus> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,  // ส่ง JWT token ใน header
      'Content-Type': 'application/json'  // กำหนด Content-Type ให้ถูกต้อง
    });

    return this.http.get<FollowStatus>(
      `${this.baseUrl}/follows/follow-status?following_id=${following_id}&followed_id=${followed_id}`, { headers }
    );
  }

  getFollowCount(userId: string): Observable<FollowCount> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`,  // ส่ง JWT token ใน header
      'Content-Type': 'application/json'  // กำหนด Content-Type ให้ถูกต้อง
    });

    return this.http.get<FollowCount>(
      `${this.baseUrl}/follows/follow-count?userId=${userId}`, { headers }

    );
  }

  sendReport(reason: string, pid: number, uid: string | number): Observable<any> {
    const body = { reason, pid, uid: Number(uid) };
    return this.http.post(`${this.baseUrl}/report/send-report`, body);
  }


}
