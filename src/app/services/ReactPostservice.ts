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
    return this.http.post(`${this.baseUrl}/likepost/like`, likePost, { headers });
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
   return this.http.get(`${this.baseUrl}/likepost/check-like-status?post_id=${postId}`, { headers });
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

    // ดึงข้อมูล follow count แบบ public (ไม่ต้องมี token)
  getFollowCountPublic(userId: string): Observable<FollowCount> {
    return this.http.get<FollowCount>(
      `${this.baseUrl}/follows/public/follow-count?userId=${userId}`
    ).pipe(
      catchError((error) => {
        console.error('Error fetching follow count (public):', error);
        return throwError(error);
      })
    );
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
        // Log response ที่ได้จาก API
      }),
      catchError((error) => {
        console.error('API Error:', error); // Log กรณีเกิดข้อผิดพลาด
        return throwError(error); // ส่งข้อผิดพลาดกลับไป
      })
    );
  }

  getShareStatus(data: SharePostModel): Observable<{ isShared: boolean; share_count?: number }> {
    const token = localStorage.getItem('token'); // JWT Token
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<{ isShared: boolean; share_count?: number }>(
      `${this.baseUrl}/sharepost/get-status`,
      data, // ส่ง object SharePostModel
      { headers }
    );
  }

  saveOrUnsavePost(data: SavePostModel): Observable<{ message: string; isSave: boolean; save_count?: number; share_count?: number }> {
    const token = localStorage.getItem('token'); // JWT Token
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<{ message: string; isSave: boolean; save_count?: number; share_count?: number }>(
      `${this.baseUrl}/savepost/save`,
      data,
      { headers }).pipe(
        tap((response) => {
          // Log response ที่ได้จาก API
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

  // ฟังก์ชันดึงจำนวนการแชร์โพสต์
  getShareCount(post_id: number): Observable<{ post_id: number; share_count: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<{ post_id: number; share_count: number }>(
      `${this.baseUrl}/sharepost/get-share-count`,
      { post_id },
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Share count response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching share count:', error);
        return throwError(error);
      })
    );
  }

  // ฟังก์ชันดึงจำนวนการเซฟโพสต์
  getSaveCount(post_id: number): Observable<{ post_id: number; save_count: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<{ post_id: number; save_count: number }>(
      `${this.baseUrl}/savepost/get-save-count`,
      { post_id },
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Save count response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching save count:', error);
        return throwError(error);
      })
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
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      console.error('Token not found');
      // ล้างข้อมูล session และ redirect
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
      return throwError('Token not found');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<FollowCount>(
      `${this.baseUrl}/follows/follow-count?userId=${userId}`,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('Error fetching follow count:', error);
        if (error.status === 401) {
          console.error('Token หมดอายุหรือไม่ถูกต้อง');
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
        }
        return throwError(error);
      })
    );
  }

  sendReport(reason: string, pid: number, uid: string | number): Observable<any> {
    const body = { reason, pid, uid: Number(uid) };
    return this.http.post(`${this.baseUrl}/report/send-report`, body);
  }

  Noti_Like(uid: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/noti/notifications_like/${uid}`);
  }

  Noti_Likeread(lid: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/noti/notifications_like/read/${lid}`, {});
  }

  Noti_Follow(uid: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/noti/notifications_follow/${uid}`);
  }

  Noti_Followread(follow_id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/noti/notifications_follow/read/${follow_id}`, {});
  }

  Noti_Shared(uid: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/noti/notifications_shared/${uid}`);
  }

  Noti_Sharedwread(shared_id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/noti/notifications_shared/read/${shared_id}`, {});
  }

  Noti_Comment(uid: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/noti/notifications_comment/${uid}`);
  }

  Noti_Commentread(cid: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/noti/notifications_comment/read/${cid}`, {});
  }

  Noti_Reportaddmin(): Observable<any> {
    return this.http.get(`${this.baseUrl}/noti/notifications_reports`);
  }

  Noti_Unban(uid: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/noti/notifications_unban/${uid}`, {});
  }

  // ฟังก์ชันดึงรายชื่อผู้ติดตาม
  getFollowers(userId: string): Observable<{ followers: any[] }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found');
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ followers: any[] }>(
      `${this.baseUrl}/follows/followers?userId=${userId}`,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Followers response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching followers:', error);
        return throwError(error);
      })
    );
  }

  // ฟังก์ชันดึงรายชื่อผู้ที่เราติดตาม (ต้อง login)
  getFollowingList(userId: string): Observable<{ following_list: any[], count: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token not found'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ following_list: any[], count: number }>(
      `${this.baseUrl}/follows/following-list`,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Following list response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching following list:', error);
        return throwError(error);
      })
    );
  }

  // ฟังก์ชันดึงรายชื่อผู้ที่ติดตามเรา (ต้อง login)
  getFollowersList(userId: string): Observable<{ followers_list: any[], count: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token not found'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ followers_list: any[], count: number }>(
      `${this.baseUrl}/follows/followers-list`,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Followers list response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching followers list:', error);
        return throwError(error);
      })
    );
  }

  // ฟังก์ชันดึงรายชื่อผู้ที่ติดตาม userId ที่ระบุ (ต้อง login)
  getFollowersByUserId(userId: string): Observable<{ followers_list: any[], count: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token not found'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ followers_list: any[], count: number }>(
      `${this.baseUrl}/follows/followers?userId=${userId}`,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Followers by userId response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching followers by userId:', error);
        return throwError(error);
      })
    );
  }

  // ฟังก์ชันดึงรายชื่อผู้ที่ userId ระบุติดตาม (ต้อง login)
  getFollowingByUserId(userId: string): Observable<{ following_list: any[], count: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token not found'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ following_list: any[], count: number }>(
      `${this.baseUrl}/follows/following?userId=${userId}`,
      { headers }
    ).pipe(
      tap((response) => {
        console.log('Following by userId response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching following by userId:', error);
        return throwError(error);
      })
    );
  }

  // ===== ฟังก์ชันใหม่สำหรับการแจ้งเตือนแบบรวม =====

  // ดึงการแจ้งเตือนทั้งหมดในครั้งเดียว (แทนการเรียก 5 ครั้ง)
  getAllNotifications(userId: string): Observable<{
    likes: any[];
    follows: any[];
    shares: any[];
    comments: any[];
    all: any[];
  }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token not found'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{
      likes: any[];
      follows: any[];
      shares: any[];
      comments: any[];
      all: any[];
    }>(`${this.baseUrl}/noti/notifications_all/${userId}`, { headers }).pipe(
      tap((response) => {
        console.log('All notifications response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching all notifications:', error);
        return throwError(error);
      })
    );
  }

  // Mark as read การแจ้งเตือนทั้งหมดในครั้งเดียว
  markAllNotificationsAsRead(userId: string): Observable<{
    message: string;
    affectedRows: {
      likes: number;
      follows: number;
      shares: number;
      comments: number;
    };
  }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token not found'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<{
      message: string;
      affectedRows: {
        likes: number;
        follows: number;
        shares: number;
        comments: number;
      };
    }>(`${this.baseUrl}/noti/notifications_all/read/${userId}`, {}, { headers }).pipe(
      tap((response) => {
        console.log('Mark all notifications as read response:', response);
      }),
      catchError((error) => {
        console.error('Error marking all notifications as read:', error);
        return throwError(error);
      })
    );
  }

  // ===== ฟังก์ชันใหม่สำหรับการแจ้งเตือนแบบรวม (ไม่ต้องมี token) =====

  // ดึงการแจ้งเตือนทั้งหมดแบบ public (ไม่ต้องมี token)
  getAllNotificationsPublic(userId: string): Observable<{
    likes: any[];
    follows: any[];
    shares: any[];
    comments: any[];
    all: any[];
  }> {
    return this.http.get<{
      likes: any[];
      follows: any[];
      shares: any[];
      comments: any[];
      all: any[];
    }>(`${this.baseUrl}/notifications_all/${userId}`).pipe(
      tap((response) => {
        console.log('All notifications public response:', response);
      }),
      catchError((error) => {
        console.error('Error fetching all notifications (public):', error);
        return throwError(error);
      })
    );
  }

}
