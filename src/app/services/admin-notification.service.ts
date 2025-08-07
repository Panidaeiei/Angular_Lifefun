import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AdminNotificationCounts {
  report: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {
  private apiUrl = environment.apiBaseUrl;
  private notificationCounts$ = new BehaviorSubject<AdminNotificationCounts>({
    report: 0,
    total: 0
  });
  private autoUpdateSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  // ดึงจำนวนการแจ้งเตือน
  loadNotificationCounts(adminId: string): void {
     this.http.get<any>(`${this.apiUrl}/noti/notifications_reports`).subscribe({
      next: (response) => {
        const reportCount = response.reports ? response.reports.length : 0;
        const counts: AdminNotificationCounts = {
          report: reportCount,
          total: reportCount
        };
        this.notificationCounts$.next(counts);
        console.log('Admin notification counts loaded:', counts);
      },
      error: (error) => {
        console.error('Error loading admin notification counts:', error);
         // ใช้ค่าเริ่มต้นเมื่อ API ไม่ทำงาน
        const defaultCounts: AdminNotificationCounts = {
          report: 0,
          total: 0
        };
        this.notificationCounts$.next(defaultCounts);
      }
    });
  }

  // เริ่มการอัปเดตอัตโนมัติ
  startAutoUpdate(adminId: string, intervalSeconds: number = 10): void {
    this.stopAutoUpdate();
      
    // ใช้ API ที่มีอยู่จริง
    this.http.get<any>(`${this.apiUrl}/noti/notifications_reports`).subscribe({
      next: (response) => {
        // ถ้า API ทำงานได้ ให้เริ่ม auto update
        this.startAutoUpdateTimer(adminId, intervalSeconds);
      },
      error: (error) => {
        console.error('API endpoint not available, stopping auto update:', error);
        // ใช้ค่าเริ่มต้นเมื่อ API ไม่ทำงาน
        const defaultCounts: AdminNotificationCounts = {
          report: 0,
          total: 0
        };
        this.notificationCounts$.next(defaultCounts);
      }
    });
  }

  // แยกฟังก์ชันสำหรับ timer
  private startAutoUpdateTimer(adminId: string, intervalSeconds: number): void {
    this.autoUpdateSubscription = timer(0, intervalSeconds * 1000).pipe(
      switchMap(() => {
         return this.http.get<any>(`${this.apiUrl}/noti/notifications_reports`);
      })
    ).subscribe({
      next: (response) => {
         const reportCount = response.reports ? response.reports.length : 0;
        const counts: AdminNotificationCounts = {
         report: reportCount,
          total: reportCount
        };
        this.notificationCounts$.next(counts);
      },
      error: (error) => {
        console.error('Error in auto update:', error);
         this.stopAutoUpdate();
      }
    });
  }

  // หยุดการอัปเดตอัตโนมัติ
  stopAutoUpdate(): void {
    if (this.autoUpdateSubscription) {
      this.autoUpdateSubscription.unsubscribe();
      this.autoUpdateSubscription = undefined;
    }
  }

  // อัปเดตทันที
  refreshImmediately(adminId: string): void {
    this.loadNotificationCounts(adminId);
  }

  // เพิ่มการแจ้งเตือนทันที
  addNotificationImmediately(type: string): void {
    const currentCounts = this.notificationCounts$.value;
    const newCounts = { ...currentCounts };
    
    if (type === 'report') {
      newCounts.report += 1;
      newCounts.total += 1;
    }
    
    this.notificationCounts$.next(newCounts);
  }

  // Observable สำหรับการติดตามการเปลี่ยนแปลง
  get notificationCounts(): Observable<AdminNotificationCounts> {
    return this.notificationCounts$.asObservable();
  }
} 