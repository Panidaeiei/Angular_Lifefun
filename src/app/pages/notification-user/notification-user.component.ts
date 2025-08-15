import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ReactPostservice } from '../../services/ReactPostservice';
import { MatBadgeModule } from '@angular/material/badge';
import { UserService } from '../../services/Userservice';
import { NotificationService } from '../../services/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { FormatLocalTimePipe } from '../../pipes/time-ago.pipe';


@Component({
  selector: 'app-notification-user',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatSidenavModule, MatBadgeModule, MatTooltipModule, FormatLocalTimePipe],
  templateUrl: './notification-user.component.html',
  styleUrls: ['./notification-user.component.scss'] // Corrected property name and path
})
export class NotificationUserComponent {
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  isNotiDrawerOpen = true;
  selectedCard: any = null;
  notifications: any[] = [];
  notificationsFollow: any[] = [];
  likers: any[] = [];
  showLikersBox = false;
  latestLikerName: string = '';
  showFollowersBox: boolean = false;
  unreadLikeCount: number = 0;
  latestFollowerName: string = '';
  unreadFollowCount: number = 0;
  notificationsShare: any[] = [];
  unreadShareCount: number = 0;
  latestSharedName: string = '';
  showSharedBox: boolean = false;
  notificationsComment: any[] = [];
  unreadCommentCount: number = 0;
  latestCommenterName: string = '';
  showCommentBox: boolean = false;
  currentUserId: string | null = null;
  notificationsUnban: any[] = [];
  unreadUnbanCount: number = 0;
  isMobile: boolean = false; // เพิ่มตัวแปรนี้
  notificationCounts: any = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };

  constructor(
    private route: ActivatedRoute, 
    private notificationService: ReactPostservice, 
    private userService: UserService, 
    private globalNotificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    this.checkScreenSize();
    
    // โหลด currentUserId เพื่อใช้ในการนำทาง
    this.userService.loadCurrentUserId();
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
    });
    
    // ตรวจสอบ UID แค่ครั้งเดียว
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
      // ตรวจสอบว่า userId ใน URL ตรงกับ userId ที่ล็อกอิน
      if (this.userId !== loggedInUserId) {
        this.clearStoredData();
        this.router.navigate(['/login'], { 
          queryParams: { error: 'uid_mismatch' },
          replaceUrl: true
        });
        return;
      }
      // เรียก API แค่ครั้งเดียว
      this.loadNotificationData();
    }
    
    // ลบ subscription ที่ทำให้เรียก API ซ้ำออก
    // ไม่ต้อง subscribe queryParams เพราะจะทำให้เรียก API ซ้ำ
  }

  // แยกฟังก์ชันสำหรับโหลดข้อมูลการแจ้งเตือน
  private loadNotificationData(): void {
    // ตรวจสอบ UID ก่อนโหลดข้อมูล
    if (!this.validateCurrentUser()) return;
    
    if (this.userId) {
        this.loadNotifications_like();
        this.loadNotifications_follow();
        this.loadNotifications_share();
        this.loadNotifications_comment();
        this.loadNotificationsUnban();
      }
  }

  // เพิ่มฟังก์ชันตรวจสอบ UID
  private validateCurrentUser(): boolean {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (!loggedInUserId || !this.userId || loggedInUserId !== this.userId) {
      console.warn('UID validation failed, redirecting to login');
      this.clearStoredData();
      this.router.navigate(['/login'], { 
        queryParams: { error: 'uid_validation_failed' },
        replaceUrl: true
      });
      return false;
    }
    
    return true;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  toggleHeart(): void {
    this.isLiked = !this.isLiked; // สลับสถานะ isLiked เมื่อคลิก
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  toggleNotiDrawer() {
    this.isNotiDrawerOpen = !this.isNotiDrawerOpen;
  }

  selectCard(cardType: string): void {
    this.selectedCard = cardType;
    this.isNotiDrawerOpen = false;

    if (cardType === 'like') {
      this.loadNotifications_like();
    } else if (cardType === 'follow') {
      this.loadNotifications_follow();
    } else if (cardType === 'share') {
      this.loadNotifications_share();
    } else if (cardType === 'comment') {
      this.loadNotifications_comment();
    } else if (cardType === 'unban') {
      this.loadNotificationsUnban();
    }
  }


  loadNotifications_like(): void {
    this.notificationService.Noti_Like(Number(this.userId)).subscribe(
      res => {
        this.notifications = res.likes;
        this.updateUnreadCount();

        // หาไลค์ล่าสุด (สมมติข้อมูลถูกจัดเรียงวันที่ล่าสุดอยู่ด้านบน)
        if (this.notifications.length > 0) {
          this.latestLikerName = this.notifications[0].username;
        } else {
          this.latestLikerName = '';
        }

        // นับจำนวนการแจ้งเตือนที่ยังไม่อ่าน (notify === 0)
        this.unreadLikeCount = this.notifications.filter(noti => noti.notify === 0).length;

        this.showLikersBox = true;
      },
      err => {
        this.showLikersBox = false;
        this.latestLikerName = '';
        this.unreadLikeCount = 0;
      }
    );
  }

  onLikeNotificationClick(noti: any): void {
    // ตรวจสอบ UID ก่อนดำเนินการ
    if (!this.validateCurrentUser()) return;
    
    if (noti.notify === 0) {
      this.notificationService.Noti_Likeread(noti.lid).subscribe({
        next: () => {
          noti.notify = 1;  // เปลี่ยนสถานะอ่านแล้ว
          this.updateUnreadCount();
          // อัปเดต global notification service แบบทันที
          this.globalNotificationService.markAsRead('like', noti.lid);
          // อัปเดตการแจ้งเตือนแบบทันที
          if (this.userId) {
            this.globalNotificationService.refreshImmediately(Number(this.userId));
          }
        },
        error: err => {
          // Error handling
        }
      });
    }
  }

  updateUnreadCount(): void {
    this.unreadLikeCount = this.notifications.filter(noti => noti.notify === 0).length;
  }

  loadNotifications_follow(): void {
    this.notificationService.Noti_Follow(Number(this.userId)).subscribe(
      res => {
        this.notificationsFollow = res.follows;
        this.showFollowersBox = false;
        this.latestFollowerName = '';
        this.unreadFollowCount = this.notificationsFollow.filter(noti => noti.notify === 1).length; // อัปเดตตรงนี้ด้วย
      },
      err => {
        this.showFollowersBox = false;
        this.latestFollowerName = '';
        this.unreadFollowCount = 0;
      }
    );
  }

  onFollowNotificationClick(noti: any): void {
    // ตรวจสอบ UID ก่อนดำเนินการ
    if (!this.validateCurrentUser()) return;
    
    if (noti.notify === 1) {
      this.notificationService.Noti_Followread(noti.follow_id).subscribe({
        next: () => {
          noti.notify = 0;
          this.updateUnreadFollowCount();
          // อัปเดต global notification service แบบทันที
          this.globalNotificationService.markAsRead('follow', noti.follow_id);
          // อัปเดตการแจ้งเตือนแบบทันที
          if (this.userId) {
            this.globalNotificationService.refreshImmediately(Number(this.userId));
          }
          this.goToProfile(noti.follow_uid);
        },
        error: err => {
          // Error handling
        }
      });
    } else {
      this.goToProfile(noti.follow_uid);
    }
  }

  goToProfile(userId: string): void {
    // ตรวจสอบ UID ก่อนดำเนินการ
    if (!this.validateCurrentUser()) return;
    
    if (!userId) {
      return;
    }

    this.router.navigate(['/view_user', this.currentUserId], { queryParams: { Profileuser: userId } });

  }

  updateUnreadFollowCount(): void {
    this.unreadFollowCount = this.notificationsFollow.filter(noti => noti.notify === 1).length;
  }

  loadNotifications_share(): void {
    this.notificationService.Noti_Shared(Number(this.userId)).subscribe(
      res => {
        this.notificationsShare = res.shares; // รับข้อมูลการแชร์โพสต์
        const unread = this.notificationsShare.filter(noti => noti.notify === 0);
        this.unreadShareCount = unread.length;

        // เก็บชื่อของผู้ที่แชร์ล่าสุด (เฉพาะ noti ที่ยังไม่อ่าน)
        if (unread.length > 0) {
          this.latestSharedName = unread[0].username;
        } else {
          this.latestSharedName = '';
        }

        this.showSharedBox = false;
      },
      err => {
        this.notificationsShare = [];
        this.unreadShareCount = 0;
        this.latestSharedName = '';
        this.showSharedBox = false;
      }
    );
  }

  onShareNotificationClick(noti: any): void {
    // ตรวจสอบ UID ก่อนดำเนินการ
    if (!this.validateCurrentUser()) return;
    
    if (noti.notify === 0) {   // <-- เงื่อนไขนี้หมายถึง "ยังไม่อ่าน" (notify=0)
      this.notificationService.Noti_Sharedwread(noti.share_id).subscribe({
        next: () => {
          noti.notify = 1;       // <-- แต่หลังจากอ่านแล้วคุณตั้ง notify = 1 ซึ่งหมายถึง "อ่านแล้ว"
          this.updateUnreadShareCount();
          // อัปเดต global notification service แบบทันที
          this.globalNotificationService.markAsRead('share', noti.share_id);
          // อัปเดตการแจ้งเตือนแบบทันที
          if (this.userId) {
            this.globalNotificationService.refreshImmediately(Number(this.userId));
          }
        },
        error: err => {
          // Error handling
        }
      });
    }
  }

  updateUnreadShareCount(): void {
    this.unreadShareCount = this.notificationsShare.filter(noti => noti.notify === 1).length;
  }

  loadNotifications_comment(): void {
    this.notificationService.Noti_Comment(Number(this.userId)).subscribe(
      res => {
        this.notificationsComment = res.comments; // สมมติ API ส่งมาใน key 'comments'
        const unread = this.notificationsComment.filter(noti => noti.notify === 0); // ยังไม่อ่าน
        this.unreadCommentCount = unread.length;

        // เก็บชื่อผู้คอมเมนต์ล่าสุด (เฉพาะที่ยังไม่อ่าน)
        if (unread.length > 0) {
          this.latestCommenterName = unread[0].username;
        } else {
          this.latestCommenterName = '';
        }

        this.showCommentBox = false;
      },
      err => {
        this.notificationsComment = [];
        this.unreadCommentCount = 0;
        this.latestCommenterName = '';
        this.showCommentBox = false;
      }
    );
  }

  onCommentNotificationClick(noti: any): void {
    // ตรวจสอบ UID ก่อนดำเนินการ
    if (!this.validateCurrentUser()) return;
    
    if (noti.notify === 0) {  // ยังไม่อ่าน
      this.notificationService.Noti_Commentread(noti.cid).subscribe({
        next: () => {
          noti.notify = 1;   // อ่านแล้ว
          this.updateUnreadCommentCount();
          // อัปเดต global notification service แบบทันที
          this.globalNotificationService.markAsRead('comment', noti.cid);
          // อัปเดตการแจ้งเตือนแบบทันที
          if (this.userId) {
            this.globalNotificationService.refreshImmediately(Number(this.userId));
          }
        },
        error: err => {
          // Error handling
        }
      });
    }
  }

  updateUnreadCommentCount(): void {
    this.unreadCommentCount = this.notificationsComment.filter(noti => noti.notify === 0).length;
  }

  loadNotificationsUnban(): void {
    this.notificationService.Noti_Unban(Number(this.userId)).subscribe(
      res => {
        this.notificationsUnban = res.unban;

        // นับเฉพาะแจ้งเตือนที่ยังไม่อ่าน (notify === 1)
        this.unreadUnbanCount = this.notificationsUnban.filter(n => n.status === "1").length;
      },
      err => {
        this.notificationsUnban = [];
        this.unreadUnbanCount = 0;
      }
    );
  }

  logout() {
    this.clearStoredData();
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUserId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('currentUserId');
    this.router.navigate(['/login']);
  }

  private clearStoredData(): void {
    this.userId = '';
    this.notifications = [];
    this.notificationsFollow = [];
    this.likers = [];
    this.showLikersBox = false;
    this.latestLikerName = '';
    this.showFollowersBox = false;
    this.unreadLikeCount = 0;
    this.latestFollowerName = '';
    this.unreadFollowCount = 0;
    this.notificationsShare = [];
    this.unreadShareCount = 0;
    this.latestSharedName = '';
    this.showSharedBox = false;
    this.notificationsComment = [];
    this.unreadCommentCount = 0;
    this.latestCommenterName = '';
    this.showCommentBox = false;
    this.notificationsUnban = [];
    this.unreadUnbanCount = 0;
  }
}