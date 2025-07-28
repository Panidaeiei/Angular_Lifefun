# ตัวอย่างการใช้งานจุดแดงการแจ้งเตือนที่ไอคอน Bell

## ภาพรวม
จุดแดงจะปรากฏที่ไอคอนการแจ้งเตือน (bell icon) เมื่อมีการแจ้งเตือนที่ยังไม่อ่าน โดยมี animation กระพริบเพื่อดึงดูดความสนใจ

## การใช้งาน

### 1. HTML Template
```html
<!-- เพิ่มที่ไอคอนการแจ้งเตือน -->
<a class="menu-item" [routerLink]="['/Notification_user']" [queryParams]="{ id: currentUserId }">
  <div class="bell-icon-container">
    <i class="fa-solid fa-bell"></i>
    <div class="notification-dot" *ngIf="notificationCounts.total > 0"></div>
  </div>
  <span>การแจ้งเตือน</span>
</a>
```

### 2. TypeScript Component
```typescript
import { NotificationService, NotificationCounts } from '../../services/notification.service';

export class YourComponent implements OnDestroy {
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.startNotificationTracking();
  }

  private startNotificationTracking(): void {
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (userId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.notificationService.loadNotificationCounts(Number(userId));
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.notificationService.startAutoUpdate(Number(userId));
      
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

### 3. CSS (ถ้าต้องการปรับแต่งเฉพาะหน้า)
```scss
/* จุดแดงการแจ้งเตือนที่ toolbar */
.notification-dot {
  position: absolute;
  top: 8px;
  right: 60px;
  width: 8px;
  height: 8px;
  background-color: #ff4444;
  border-radius: 50%;
  border: 1px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: notificationPulse 2s infinite;
  z-index: 1001;
}

@keyframes notificationPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

## หน้าที่รองรับ

### 1. Homepage User
- ✅ จุดแดงปรากฏที่ไอคอนการแจ้งเตือน
- ✅ อัปเดตเมื่อมีการแจ้งเตือนใหม่
- ✅ หายไปเมื่ออ่านการแจ้งเตือน

### 2. Notification User
- ✅ จุดแดงปรากฏที่ไอคอนการแจ้งเตือน
- ✅ อัปเดตเมื่อมีการแจ้งเตือนใหม่
- ✅ หายไปเมื่ออ่านการแจ้งเตือน

### 3. หน้าอื่นๆ ที่ต้องการเพิ่ม
```typescript
// เพิ่มใน component ที่ต้องการ
import { NotificationService, NotificationCounts } from '../../services/notification.service';

export class YourPageComponent implements OnDestroy {
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

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

## การปรับแต่ง

### 1. เปลี่ยนตำแหน่งจุดแดง
```scss
.notification-dot {
  position: absolute;
  top: -5px;        /* ปรับตำแหน่งบน */
  right: -5px;      /* ปรับตำแหน่งขวา */
  /* ... */
}
```

### 2. เปลี่ยนสีจุดแดง
```scss
.notification-dot {
  background-color: #ff0000;  /* สีแดงเข้ม */
  /* หรือ */
  background-color: #ff6b6b;  /* สีแดงอ่อน */
  /* ... */
}
```

### 3. เปลี่ยนขนาดจุดแดง
```scss
.notification-dot {
  width: 10px;      /* ปรับความกว้าง */
  height: 10px;     /* ปรับความสูง */
  /* ... */
}
```

### 4. เปลี่ยนความเร็ว Animation
```scss
.notification-dot {
  animation: notificationPulse 1s infinite;  /* เร็วขึ้น */
  /* หรือ */
  animation: notificationPulse 3s infinite;  /* ช้าลง */
}

@keyframes notificationPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);    /* ขยายมากขึ้น */
    opacity: 0.6;             /* โปร่งใสมากขึ้น */
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

## การทดสอบ

### 1. ตรวจสอบการแสดงผล
- เปิดแอปและดูว่าจุดแดงปรากฏที่ไอคอนการแจ้งเตือน
- ตรวจสอบตำแหน่งและขนาดของจุดแดง

### 2. ทดสอบการอัปเดต
- สร้างการแจ้งเตือนใหม่
- ดูว่าจุดแดงปรากฏทันที

### 3. ทดสอบการหายไป
- อ่านการแจ้งเตือนทั้งหมด
- ดูว่าจุดแดงหายไป

### 4. ทดสอบ Animation
- ดู animation กระพริบของจุดแดง
- ตรวจสอบความเร็วและความนุ่มนวล

## ข้อดี

1. **เรียบง่าย**: แสดงแค่จุดแดงเล็กๆ ไม่รบกวนการใช้งาน
2. **ดึงดูดความสนใจ**: มี animation กระพริบ
3. **ประหยัดพื้นที่**: ใช้พื้นที่น้อยที่ไอคอน
4. **ใช้งานง่าย**: ใช้ได้ในทุกหน้า
5. **ปรับแต่งได้**: สามารถเปลี่ยนสี ขนาด และตำแหน่งได้ 