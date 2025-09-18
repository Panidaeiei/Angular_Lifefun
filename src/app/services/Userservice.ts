import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, throwError, map } from 'rxjs';
import { User } from '../models/register_model';
import { environment } from '../../environments/environment';
import { SearchUser } from '../models/search-user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend

  constructor(private http: HttpClient) { }

  private currentUserIdSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  setCurrentUserId(userId: string): void {
    this.currentUserIdSubject.next(userId); // อัปเดตค่าใน BehaviorSubject
    localStorage.setItem('currentUserId', userId); // เก็บค่าใน LocalStorage
  }

  getCurrentUserId(): Observable<string | null> {
    return this.currentUserIdSubject.asObservable();
  }

  getCurrentUser(): Observable<User> {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (!userId) {
      return throwError(() => new Error('No userId found'));
    }
    return this.getUserById(userId);
  }

  loadCurrentUserId(): void {
    const storedUserId = localStorage.getItem('currentUserId');
    if (storedUserId) {
      this.currentUserIdSubject.next(storedUserId); // ตั้งค่าใน BehaviorSubject
    }
  }

  logout(): void {
    this.currentUserIdSubject.next(null); // ล้างค่าใน BehaviorSubject
    localStorage.removeItem('currentUserId'); // ลบค่าใน LocalStorage
    localStorage.removeItem('token'); // ลบ Token
  }

  getUsers(): Observable<User[]> {
    // ดึง token ตาม role
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const token = adminToken || userToken;
    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<User[]>(`${this.baseUrl}/view_users`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch users'));
      })
    );
  }

  // ดึงข้อมูลผู้ใช้
  getUserById(userId: string): Observable<User> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<User>(`${this.baseUrl}/view_users/${userId}`, { headers });
  }

  // ดึงข้อมูลผู้ใช้หลายคนในครั้งเดียว (สำหรับ chat)
  getUsersBatch(userIds: string[]): Observable<User[]> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Unauthorized'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<User[]>(`${this.baseUrl}/batch`, { userIds }, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching batch users:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch batch users'));
      })
    );
  }

  // ลงทะเบียนผู้ใช้
  registerUser(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, formData);
  }


  // อัปเดตข้อมูลผู้ใช้
  updateUser(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.put(`${this.baseUrl}/edit_user`, formData, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating user:', error);
        return throwError(() => error);
      })
    );
  }

  // เปลี่ยนรหัสผ่าน (แยกจากการแก้ข้อมูลอื่น เพื่อลดผลกระทบ)
  changePassword(uid: string, oldPassword: string, newPassword: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // ใช้ FormData เพื่อให้เข้ากับ backend ที่รองรับ multer ได้เสมอ
    const formData = new FormData();
    formData.append('uid', uid);
    formData.append('old_password', oldPassword);
    formData.append('password', newPassword);

    return this.http.put(`${this.baseUrl}/edit_user`, formData, { headers }).pipe(
      // ส่งต่อ HttpErrorResponse ทั้งก้อน เพื่อให้ฝั่ง UI อ่าน status/message เดิมได้
      catchError((error: HttpErrorResponse) => throwError(() => error))
    );
  }


  // ลบผู้ใช้
  deleteUser(userId: string): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const url = `${this.baseUrl}/deleteUser/${userId}`;
    return this.http.delete(url, { headers }).pipe(
      catchError((error) => {
        console.error('Error in deleteUser:', error);
        return throwError(() => new Error(error.message));
      })
    );
  }

  // ตรวจสอบว่าผู้ใช้ยังมีอยู่ในระบบหรือไม่
  checkUserExists(userId: string): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<User>(`${this.baseUrl}/view_users/${userId}`, { headers }).pipe(
      // ถ้าสำเร็จแสดงว่าผู้ใช้มีอยู่
      map(() => true),
      catchError((error) => {
        console.error(`Error checking user ${userId}:`, error);
        // ถ้าเกิด error (เช่น 404) แสดงว่าผู้ใช้ไม่มีอยู่
        return throwError(() => new Error('User not found'));
      })
    );
  }

  searchUsers(username: string): Observable<SearchUser[]> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Unauthorized: Token not found in LocalStorage or SessionStorage'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<SearchUser[]>(`${this.baseUrl}/search_user?username=${username}`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching searched users:', error);
        return throwError(() => new Error(error.message || 'Failed to search users'));
      })
    );
  }

  // ค้นหาผู้ใช้แบบ public (ไม่ต้องมี token)
  searchUsersPublic(username: string): Observable<SearchUser[]> {
    return this.http.get<SearchUser[]>(`${this.baseUrl}/search_user?username=${username}`).pipe(
      catchError(error => {
        console.error('Error fetching searched users (public):', error);
        return throwError(() => new Error(error.message || 'Failed to search users'));
      })
    );
  }


}
