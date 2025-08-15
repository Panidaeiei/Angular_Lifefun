import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationEvent {
  type: 'like' | 'follow' | 'comment' | 'share' | 'unban';
  userId: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationEventService {
  private notificationEvents$ = new BehaviorSubject<NotificationEvent[]>([]);
  private notificationCounts$ = new BehaviorSubject<any>({
    like: 0,
    follow: 0,
    comment: 0,
    share: 0,
    unban: 0,
    total: 0
  });

  constructor() {
    // โหลดข้อมูลจาก localStorage ตอนเริ่มต้น
    this.loadFromStorage();
  }

  // เพิ่มการแจ้งเตือนใหม่
  addNotification(type: NotificationEvent['type'], userId: string): void {
    const newEvent: NotificationEvent = {
      type,
      userId,
      timestamp: Date.now()
    };

    const currentEvents = this.notificationEvents$.value;
    const updatedEvents = [...currentEvents, newEvent];
    
    this.notificationEvents$.next(updatedEvents);
    this.updateCounts(updatedEvents);
    this.saveToStorage(updatedEvents);
  }

  // ล้างการแจ้งเตือน (เมื่อ user อ่านแล้ว)
  clearNotifications(userId: string): void {
    this.notificationEvents$.next([]);
    this.updateCounts([]);
    this.saveToStorage([]);
  }

  // อัปเดตจำนวนการแจ้งเตือน
  private updateCounts(events: NotificationEvent[]): void {
    const counts = {
      like: events.filter(e => e.type === 'like').length,
      follow: events.filter(e => e.type === 'follow').length,
      comment: events.filter(e => e.type === 'comment').length,
      share: events.filter(e => e.type === 'share').length,
      unban: events.filter(e => e.type === 'unban').length,
      total: events.length
    };

    this.notificationCounts$.next(counts);
  }

  // บันทึกลง localStorage
  private saveToStorage(events: NotificationEvent[]): void {
    localStorage.setItem('notificationEvents', JSON.stringify(events));
  }

  // โหลดจาก localStorage
  private loadFromStorage(): void {
    const stored = localStorage.getItem('notificationEvents');
    if (stored) {
      try {
        const events = JSON.parse(stored);
        this.notificationEvents$.next(events);
        this.updateCounts(events);
      } catch (error) {
        console.error('Error loading notification events:', error);
      }
    }
  }

  // Observable สำหรับการแจ้งเตือน
  get notifications(): Observable<NotificationEvent[]> {
    return this.notificationEvents$.asObservable();
  }

  // Observable สำหรับจำนวนการแจ้งเตือน
  get counts(): Observable<any> {
    return this.notificationCounts$.asObservable();
  }

  // รับจำนวนการแจ้งเตือนปัจจุบัน
  get currentCounts(): any {
    return this.notificationCounts$.value;
  }
}
