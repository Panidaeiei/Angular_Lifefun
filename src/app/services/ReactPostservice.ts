import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LikePost } from '../models/LikePost_model';

@Injectable({
  providedIn: 'root',
})
export class LikePostService {
  private baseUrl = environment.apiBaseUrl;  // URL ของ API ที่ทำงานใน Node.js

  // ใช้ BehaviorSubject สำหรับติดตามสถานะไลค์
  public likeStatusSubject = new BehaviorSubject<boolean>(false);
  likeStatus$ = this.likeStatusSubject.asObservable(); // ใช้ asObservable เพื่อให้ component subscribe

  constructor(private http: HttpClient) {}

  // ฟังก์ชันในการกดไลค์
  likePost(postId: number, userId: number): Observable<any> {
    const token = localStorage.getItem('token');  // ดึง JWT Token จาก localStorage

    // ตรวจสอบว่า token มีค่าหรือไม่
    if (!token) {
      return throwError('Unauthorized: No token found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);  // เพิ่ม token ใน header

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

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);  // เพิ่ม token ใน header

    // ส่ง HTTP GET request ไปที่ API ที่ตรวจสอบสถานะไลค์
    return this.http.get(`${this.baseUrl}/likepost/check-like-status?post_id=${postId}`, { headers }).pipe(
      tap((response: any) => {
        // ใช้ข้อมูลที่ได้รับจาก API เพื่อตรวจสอบว่าไลค์หรือไม่
        this.likeStatusSubject.next(response.liked);  // อัปเดตสถานะไลค์ใน BehaviorSubject
      })
    );
  }
}
