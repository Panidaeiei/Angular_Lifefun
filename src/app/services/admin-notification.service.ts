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
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!adminToken) {
      console.error('Admin token not found');
      return;
    }

    const headers = { 'Authorization': `Bearer ${adminToken}` };
    
    this.http.get<any>(`${this.apiUrl}/admin/notifications/count`, { headers }).subscribe({
      next: (response) => {
        const counts: AdminNotificationCounts = {
          report: response.report_count || 0,
          total: (response.report_count || 0)
        };
        this.notificationCounts$.next(counts);
        console.log('Admin notification counts loaded:', counts);
      },
      error: (error) => {
        console.error('Error loading admin notification counts:', error);
      }
    });
  }

  // เริ่มการอัปเดตอัตโนมัติ
  startAutoUpdate(adminId: string, intervalSeconds: number = 10): void {
    this.stopAutoUpdate();
    this.autoUpdateSubscription = timer(0, intervalSeconds * 1000).pipe(
      switchMap(() => {
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!adminToken) {
          return [];
        }
        const headers = { 'Authorization': `Bearer ${adminToken}` };
        return this.http.get<any>(`${this.apiUrl}/admin/notifications/count`, { headers });
      })
    ).subscribe({
      next: (response) => {
        const counts: AdminNotificationCounts = {
          report: response.report_count || 0,
          total: (response.report_count || 0)
        };
        this.notificationCounts$.next(counts);
      },
      error: (error) => {
        console.error('Error in auto update:', error);
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