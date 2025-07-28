# ตัวอย่างการใช้งาน Notification Badge ในหน้าต่างๆ

## 1. หน้า Homepage User

### TypeScript Component
```typescript
import { NotificationService, NotificationCounts } from '../../services/notification.service';

export class HomepageUserComponent implements OnDestroy {
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    // ... other services
  ) {}

  ngOnInit(): void {
    // เริ่มการติดตามการแจ้งเตือน
    this.startNotificationTracking();
  }

  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.notificationService.loadNotificationCounts(Number(this.userId));
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.notificationService.startAutoUpdate(Number(this.userId));
      
      // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือน
      this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
        (counts) => {
          this.notificationCounts = counts;
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.notificationService.stopAutoUpdate();
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}
```

### HTML Template
```html
<!-- เมนูหลัก -->
<a class="menu-item" [routerLink]="['/Notification_user']" [queryParams]="{ id: this.currentUserId }">
  <i class="fa-solid fa-bell" 
     [matBadge]="notificationCounts.total" 
     matBadgeColor="warn" 
     matBadgeSize="small"
     [matBadgeHidden]="notificationCounts.total === 0">
  </i>
  <span class="itim-regular">การแจ้งเตือน</span>
</a>

<!-- เมนูใน Drawer -->
<li>
  <a [routerLink]="['/Notification_user']" [queryParams]="{ id: this.currentUserId }">
    <i class="fa-solid fa-bell" 
       [matBadge]="notificationCounts.total" 
       matBadgeColor="warn" 
       matBadgeSize="small"
       [matBadgeHidden]="notificationCounts.total === 0">
    </i>
    <span class="itim-regular">การแจ้งเตือน</span>
  </a>
</li>
```

## 2. หน้า Profile User

### TypeScript Component
```typescript
import { NotificationService, NotificationCounts } from '../../services/notification.service';

export class ProfileUserComponent implements OnDestroy {
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    // ... other services
  ) {}

  ngOnInit(): void {
    this.startNotificationTracking();
  }

  private startNotificationTracking(): void {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      this.notificationService.loadNotificationCounts(Number(userId));
      this.notificationService.startAutoUpdate(Number(userId));
      
      this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
        (counts) => {
          this.notificationCounts = counts;
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.notificationService.stopAutoUpdate();
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}
```

### HTML Template
```html
<!-- เมนูการแจ้งเตือน -->
<a class="menu-item" [routerLink]="['/Notification_user']" [queryParams]="{ id: this.currentUserId }">
  <i class="fa-solid fa-bell" 
     [matBadge]="notificationCounts.total" 
     matBadgeColor="warn" 
     matBadgeSize="small"
     [matBadgeHidden]="notificationCounts.total === 0">
  </i>
  <span class="itim-regular">การแจ้งเตือน</span>
</a>
```

## 3. หน้า Category

### TypeScript Component
```typescript
import { NotificationService, NotificationCounts } from '../../services/notification.service';

export class CategoryPageComponent implements OnDestroy {
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    // ... other services
  ) {}

  ngOnInit(): void {
    this.startNotificationTracking();
  }

  private startNotificationTracking(): void {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      this.notificationService.loadNotificationCounts(Number(userId));
      this.notificationService.startAutoUpdate(Number(userId));
      
      this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
        (counts) => {
          this.notificationCounts = counts;
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.notificationService.stopAutoUpdate();
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}
```

## 4. ใช้ NotificationBadgeComponent

### Import Component
```typescript
import { NotificationBadgeComponent } from '../../components/notification-badge/notification-badge.component';

@Component({
  imports: [
    // ... other imports
    NotificationBadgeComponent
  ]
})
```

### HTML Template
```html
<!-- ใช้ component โดยตรง -->
<a [routerLink]="['/Notification_user']" [queryParams]="{ id: this.currentUserId }">
  <app-notification-badge></app-notification-badge>
  <span class="itim-regular">การแจ้งเตือน</span>
</a>
```

## 5. การอัปเดตจำนวนเมื่อมีการอ่าน

### ใน Notification User Component
```typescript
onLikeNotificationClick(noti: any): void {
  if (noti.notify === 0) {
    this.notificationService.Noti_Likeread(noti.lid).subscribe({
      next: () => {
        noti.notify = 1;
        this.updateUnreadCount();
        // อัปเดต global notification service
        this.globalNotificationService.markAsRead('like', noti.lid);
      },
      error: err => {
        console.error('Error marking notification as read:', err);
      }
    });
  }
}
```

## 6. การตั้งค่าใน app.config.ts

### Import และ Provide Services
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { NotificationService } from './services/notification.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    NotificationService
  ]
};
```

## 7. การปรับแต่ง CSS

### Global Styles (styles.scss)
```scss
// ปรับแต่ง badge ทั่วทั้งแอป
.mat-badge-content {
  background-color: #ff4444 !important;
  color: white !important;
  font-size: 10px !important;
  font-weight: bold !important;
  min-width: 16px !important;
  height: 16px !important;
  line-height: 16px !important;
  border-radius: 8px !important;
}

// Animation สำหรับ badge
.mat-badge-content {
  animation: badgePulse 0.6s ease-in-out;
}

@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

## 8. การทดสอบ

### ตรวจสอบการทำงาน
1. เปิดหน้าแอปพลิเคชัน
2. ตรวจสอบว่า badge แสดงจำนวนการแจ้งเตือนที่ถูกต้อง
3. ทดสอบการอัปเดตอัตโนมัติทุก 30 วินาที
4. ทดสอบการลดจำนวนเมื่ออ่านการแจ้งเตือน
5. ตรวจสอบ animation เมื่อจำนวนเปลี่ยนแปลง

### Debug
```typescript
// เพิ่ม console.log เพื่อ debug
this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
  (counts) => {
    this.notificationCounts = counts;
    console.log('Notification counts updated:', counts);
  }
);
``` 