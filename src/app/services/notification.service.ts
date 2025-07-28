import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface NotificationCounts {
  like: number;
  follow: number;
  share: number;
  comment: number;
  unban: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = environment.apiBaseUrl;
  private notificationCountsSubject = new BehaviorSubject<NotificationCounts>({
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  });

  public notificationCounts$ = this.notificationCountsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // โหลดจำนวนการแจ้งเตือนทั้งหมด
  loadNotificationCounts(userId: number): void {
    if (!userId) return;

    // โหลดการแจ้งเตือนไลค์
    this.loadLikeNotifications(userId);
    // โหลดการแจ้งเตือนติดตาม
    this.loadFollowNotifications(userId);
    // โหลดการแจ้งเตือนแชร์
    this.loadShareNotifications(userId);
    // โหลดการแจ้งเตือนคอมเมนต์
    this.loadCommentNotifications(userId);
    // โหลดการแจ้งเตือนปลดระงับ
    this.loadUnbanNotifications(userId);
  }

  // โหลดการแจ้งเตือนไลค์
  private loadLikeNotifications(userId: number): void {
    this.http.get(`${this.baseUrl}/noti/notifications_like/${userId}`).subscribe({
      next: (res: any) => {
        const unreadCount = res.likes?.filter((noti: any) => noti.notify === 0).length || 0;
        this.updateNotificationCount('like', unreadCount);
      },
      error: (err) => {
        console.error('Error loading like notifications:', err);
        this.updateNotificationCount('like', 0);
      }
    });
  }

  // โหลดการแจ้งเตือนติดตาม
  private loadFollowNotifications(userId: number): void {
    this.http.get(`${this.baseUrl}/noti/notifications_follow/${userId}`).subscribe({
      next: (res: any) => {
        const unreadCount = res.follows?.filter((noti: any) => noti.notify === 1).length || 0;
        this.updateNotificationCount('follow', unreadCount);
      },
      error: (err) => {
        console.error('Error loading follow notifications:', err);
        this.updateNotificationCount('follow', 0);
      }
    });
  }

  // โหลดการแจ้งเตือนแชร์
  private loadShareNotifications(userId: number): void {
    this.http.get(`${this.baseUrl}/noti/notifications_shared/${userId}`).subscribe({
      next: (res: any) => {
        const unreadCount = res.shares?.filter((noti: any) => noti.notify === 0).length || 0;
        this.updateNotificationCount('share', unreadCount);
      },
      error: (err) => {
        console.error('Error loading share notifications:', err);
        this.updateNotificationCount('share', 0);
      }
    });
  }

  // โหลดการแจ้งเตือนคอมเมนต์
  private loadCommentNotifications(userId: number): void {
    this.http.get(`${this.baseUrl}/noti/notifications_comment/${userId}`).subscribe({
      next: (res: any) => {
        const unreadCount = res.comments?.filter((noti: any) => noti.notify === 0).length || 0;
        this.updateNotificationCount('comment', unreadCount);
      },
      error: (err) => {
        console.error('Error loading comment notifications:', err);
        this.updateNotificationCount('comment', 0);
      }
    });
  }

  // โหลดการแจ้งเตือนปลดระงับ
  private loadUnbanNotifications(userId: number): void {
    this.http.get(`${this.baseUrl}/noti/notifications_unban/${userId}`).subscribe({
      next: (res: any) => {
        const unreadCount = res.unban?.filter((noti: any) => noti.status === "1").length || 0;
        this.updateNotificationCount('unban', unreadCount);
      },
      error: (err) => {
        console.error('Error loading unban notifications:', err);
        this.updateNotificationCount('unban', 0);
      }
    });
  }

  // อัปเดตจำนวนการแจ้งเตือน
  private updateNotificationCount(type: keyof Omit<NotificationCounts, 'total'>, count: number): void {
    const currentCounts = this.notificationCountsSubject.value;
    const newCounts = {
      ...currentCounts,
      [type]: count
    };
    
    // คำนวณจำนวนรวม
    newCounts.total = newCounts.like + newCounts.follow + newCounts.share + newCounts.comment + newCounts.unban;
    
    this.notificationCountsSubject.next(newCounts);
  }

  // เริ่มการอัปเดตอัตโนมัติทุก 10 วินาที (เร็วขึ้น)
  startAutoUpdate(userId: number): void {
    // อัปเดตทันทีครั้งแรก
    this.loadNotificationCounts(userId);
    
    // อัปเดตทุก 10 วินาที
    timer(10000, 10000).pipe(
      switchMap(() => {
        this.loadNotificationCounts(userId);
        return [];
      })
    ).subscribe();
  }

  // หยุดการอัปเดตอัตโนมัติ
  stopAutoUpdate(): void {
    // BehaviorSubject จะยังคงทำงานต่อไป แต่เราสามารถ reset ค่าได้
    this.notificationCountsSubject.next({
      like: 0,
      follow: 0,
      share: 0,
      comment: 0,
      unban: 0,
      total: 0
    });
  }

  // รับจำนวนการแจ้งเตือนปัจจุบัน
  getCurrentCounts(): NotificationCounts {
    return this.notificationCountsSubject.value;
  }

  // อัปเดตจำนวนการแจ้งเตือนเมื่อมีการอ่าน
  markAsRead(type: 'like' | 'follow' | 'share' | 'comment' | 'unban', id: number): void {
    const currentCounts = this.notificationCountsSubject.value;
    const currentCount = currentCounts[type];
    
    if (currentCount > 0) {
      this.updateNotificationCount(type, currentCount - 1);
    }
  }

  // อัปเดตแบบทันทีเมื่อมีการเปลี่ยนแปลง
  refreshImmediately(userId: number): void {
    console.log('Refreshing notifications immediately for user:', userId);
    this.loadNotificationCounts(userId);
  }

  // เพิ่มจำนวนการแจ้งเตือนแบบทันที (สำหรับการแจ้งเตือนใหม่)
  addNotificationImmediately(type: 'like' | 'follow' | 'share' | 'comment' | 'unban'): void {
    const currentCounts = this.notificationCountsSubject.value;
    const currentCount = currentCounts[type];
    
    this.updateNotificationCount(type, currentCount + 1);
    console.log(`Added ${type} notification immediately. New count:`, currentCount + 1);
  }
} 