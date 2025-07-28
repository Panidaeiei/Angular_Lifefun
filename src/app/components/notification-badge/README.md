# Notification Badge Component

## คำอธิบาย
Notification Badge Component เป็น component ที่ใช้แสดงจำนวนการแจ้งเตือนที่ยังไม่อ่านในรูปแบบ badge ที่ไอคอนการแจ้งเตือน

## การใช้งาน

### 1. Import Component
```typescript
import { NotificationBadgeComponent } from './components/notification-badge/notification-badge.component';
```

### 2. ใช้ใน Template
```html
<!-- ใช้ในเมนูการแจ้งเตือน -->
<a [routerLink]="['/Notification_user']" [queryParams]="{ id: currentUserId }">
  <app-notification-badge></app-notification-badge>
  <span>การแจ้งเตือน</span>
</a>
```

### 3. ใช้กับ Material Badge โดยตรง
```html
<i class="fa-solid fa-bell" 
   [matBadge]="notificationCounts.total" 
   matBadgeColor="warn" 
   matBadgeSize="small"
   [matBadgeHidden]="notificationCounts.total === 0">
</i>
```

## Features

- **Auto Update**: อัปเดตจำนวนการแจ้งเตือนอัตโนมัติทุก 30 วินาที
- **Real-time**: แสดงจำนวนการแจ้งเตือนแบบ real-time
- **Responsive**: รองรับการแสดงผลบนอุปกรณ์ทุกขนาด
- **Animation**: มี animation เมื่อจำนวนการแจ้งเตือนเปลี่ยนแปลง

## การตั้งค่า

### 1. NotificationService
Service นี้จะจัดการการโหลดและอัปเดตจำนวนการแจ้งเตือนทั้งหมด

### 2. การอัปเดตจำนวน
เมื่อมีการอ่านการแจ้งเตือน ให้เรียกใช้:
```typescript
this.notificationService.markAsRead('like', notificationId);
```

### 3. การเริ่มต้นใช้งาน
ใน component ที่ต้องการใช้:
```typescript
ngOnInit() {
  const userId = localStorage.getItem('userId');
  if (userId) {
    this.notificationService.loadNotificationCounts(Number(userId));
    this.notificationService.startAutoUpdate(Number(userId));
  }
}
```

## การแจ้งเตือนที่รองรับ

1. **Like**: การแจ้งเตือนเมื่อมีคนไลค์โพสต์
2. **Follow**: การแจ้งเตือนเมื่อมีคนติดตาม
3. **Share**: การแจ้งเตือนเมื่อมีคนแชร์โพสต์
4. **Comment**: การแจ้งเตือนเมื่อมีคนคอมเมนต์
5. **Unban**: การแจ้งเตือนการปลดระงับบัญชี

## การปรับแต่ง

### สีของ Badge
แก้ไขใน `notification-badge.component.scss`:
```scss
::ng-deep .mat-badge-content {
  background-color: #ff4444 !important;
  color: white !important;
}
```

### ขนาดของ Badge
```scss
::ng-deep .mat-badge-content {
  min-width: 16px !important;
  height: 16px !important;
  font-size: 10px !important;
}
```

### Animation
```scss
@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
``` 