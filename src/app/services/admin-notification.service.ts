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
  private isAutoUpdateRunning = false; // เพิ่ม flag เพื่อติดตามสถานะ

  constructor(private http: HttpClient) {}

  // ดึงจำนวนการแจ้งเตือน - ปิดการใช้งานเพื่อลด database connections
  loadNotificationCounts(adminId: string): void {
    console.log('Loading notification counts disabled to prevent database connection issues');
    // ใช้ค่าเริ่มต้นแทนการเรียก API
    const defaultCounts: AdminNotificationCounts = {
      report: 0,
      total: 0
    };
    this.notificationCounts$.next(defaultCounts);
  }

  // เริ่มการอัปเดตอัตโนมัติ - ปิดการใช้งานเพื่อลด database connections
  startAutoUpdate(adminId: string, intervalSeconds: number = 30): void {
    console.log('Auto update disabled to prevent database connection issues');
    // ไม่ทำอะไร - ปิดการใช้งาน auto update
    return;
  }

  // แยกฟังก์ชันสำหรับ timer - ปิดการใช้งาน
  private startAutoUpdateTimer(adminId: string, intervalSeconds: number): void {
    console.log('Auto update timer disabled to prevent database connection issues');
    // ไม่ทำอะไร - ปิดการใช้งาน timer
    return;
  }

  // หยุดการอัปเดตอัตโนมัติ
  stopAutoUpdate(): void {
    if (this.autoUpdateSubscription) {
      this.autoUpdateSubscription.unsubscribe();
      this.autoUpdateSubscription = undefined;
    }
    this.isAutoUpdateRunning = false;
  }

  // อัปเดตทันที - ปิดการใช้งานเพื่อลด database connections
  refreshImmediately(adminId: string): void {
    console.log('Refresh immediately disabled to prevent database connection issues');
    // ไม่ทำอะไร - ปิดการใช้งาน
    return;
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