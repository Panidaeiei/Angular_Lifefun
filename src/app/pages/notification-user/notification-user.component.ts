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
    try {
      const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!loggedInUserId || !token) {
        console.warn('No user ID or token found, redirecting to login');
        this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
        return;
      }

      this.checkScreenSize();
      
      // โหลด currentUserId เพื่อใช้ในการนำทาง
      this.userService.loadCurrentUserId();
      this.userService.getCurrentUserId().subscribe({
        next: (userId) => {
          this.currentUserId = userId;
        },
        error: (error) => {
          console.error('Error loading current user ID:', error);
        }
      });
      
      // ตรวจสอบ UID แค่ครั้งเดียว
      const snapshotParams = this.route.snapshot.queryParams;
      if (snapshotParams['id']) {
        this.userId = snapshotParams['id'];
        
        // ตรวจสอบว่า userId ใน URL ตรงกับ userId ที่ล็อกอิน
        if (this.userId !== loggedInUserId) {
          console.warn('UID mismatch, redirecting to login');
          this.clearStoredData();
          this.router.navigate(['/login'], { 
            queryParams: { error: 'uid_mismatch' },
            replaceUrl: true
          });
          return;
        }
        
        // เรียก API แค่ครั้งเดียว
        this.loadNotificationData();
      } else {
        console.warn('No ID parameter found in URL');
      }
      
    } catch (error) {
      console.error('Error in ngOnInit:', error);
      // ลองรีเซ็ตและโหลดใหม่
      this.resetNotificationData();
    }
  }

  // แยกฟังก์ชันสำหรับโหลดข้อมูลการแจ้งเตือน
  private loadNotificationData(): void {
    try {
      // ตรวจสอบ UID ก่อนโหลดข้อมูล
      if (!this.validateCurrentUser()) return;
      
      if (this.userId) {
        // ใช้ API ใหม่ที่ดึงการแจ้งเตือนทั้งหมดในครั้งเดียว
        this.loadAllNotifications();
      } else {
        console.warn('No userId available for loading notifications');
      }
    } catch (error) {
      console.error('Error in loadNotificationData:', error);
      this.resetNotificationData();
    }
  }

  // ฟังก์ชันใหม่: โหลดการแจ้งเตือนทั้งหมดในครั้งเดียว
  private loadAllNotifications(): void {
    this.notificationService.getAllNotifications(this.userId).subscribe({
      next: (response) => {
        // จัดการข้อมูลการแจ้งเตือนแบบไลค์
        this.notifications = response.likes || [];
        this.updateUnreadCount();
        
        // หาไลค์ล่าสุด
        if (this.notifications.length > 0) {
          this.latestLikerName = this.notifications[0].username;
        } else {
          this.latestLikerName = '';
        }
        this.unreadLikeCount = this.notifications.filter(noti => noti.notify === 0).length;
        this.showLikersBox = true;

        // จัดการข้อมูลการแจ้งเตือนแบบติดตาม
        this.notificationsFollow = response.follows || [];
        this.showFollowersBox = false;
        this.latestFollowerName = '';
        this.unreadFollowCount = this.notificationsFollow.filter(noti => noti.notify === 1).length;

        // จัดการข้อมูลการแจ้งเตือนแบบแชร์
        this.notificationsShare = response.shares || [];
        const unreadShares = this.notificationsShare.filter(noti => noti.notify === 0);
        this.unreadShareCount = unreadShares.length;
        if (unreadShares.length > 0) {
          this.latestSharedName = unreadShares[0].username;
        } else {
          this.latestSharedName = '';
        }
        this.showSharedBox = false;

        // จัดการข้อมูลการแจ้งเตือนแบบคอมเมนต์
        this.notificationsComment = response.comments || [];
        const unreadComments = this.notificationsComment.filter(noti => noti.notify === 0);
        this.unreadCommentCount = unreadComments.length;
        if (unreadComments.length > 0) {
          this.latestCommenterName = unreadComments[0].username;
        } else {
          this.latestCommenterName = '';
        }
        this.showCommentBox = false;

        // โหลดการแจ้งเตือนของระบบ (unban) ก่อนอัปเดตจำนวนรวม
        this.loadNotificationsUnban();
        
        console.log('All notifications loaded successfully:', response);
        console.log('Initial counts:', {
          like: this.unreadLikeCount,
          follow: this.unreadFollowCount,
          share: this.unreadShareCount,
          comment: this.unreadCommentCount,
          unban: this.unreadUnbanCount
        });
      },
      error: (error) => {
        console.error('Error loading all notifications:', error);
        // ตั้งค่าเริ่มต้นเมื่อเกิดข้อผิดพลาด
        this.resetNotificationData();
      }
    });
  }

  // ฟังก์ชันใหม่: อัปเดต notificationCounts
  private updateNotificationCounts(): void {
    this.notificationCounts = {
      like: this.unreadLikeCount,
      follow: this.unreadFollowCount,
      share: this.unreadShareCount,
      comment: this.unreadCommentCount,
      unban: this.unreadUnbanCount,
      total: this.unreadLikeCount + this.unreadFollowCount + this.unreadShareCount + this.unreadCommentCount + this.unreadUnbanCount
    };
  }

  // ฟังก์ชันใหม่: รีเซ็ตข้อมูลการแจ้งเตือน
  private resetNotificationData(): void {
    this.notifications = [];
    this.notificationsFollow = [];
    this.notificationsShare = [];
    this.notificationsComment = [];
    this.showLikersBox = false;
    this.showFollowersBox = false;
    this.showSharedBox = false;
    this.showCommentBox = false;
    this.latestLikerName = '';
    this.latestFollowerName = '';
    this.latestSharedName = '';
    this.latestCommenterName = '';
    this.unreadLikeCount = 0;
    this.unreadFollowCount = 0;
    this.unreadShareCount = 0;
    this.unreadCommentCount = 0;
    this.updateNotificationCounts();
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

    // เรียก API แยกตามประเภทการแจ้งเตือนเพื่อเช็คสถานะ read/unread
    if (cardType === 'like') {
      this.showLikersBox = true;
      // เรียก API แยกเพื่อเช็คสถานะ
      this.loadNotifications_like();
    } else if (cardType === 'follow') {
      this.showFollowersBox = true;
      // เรียก API แยกเพื่อเช็คสถานะ
      this.loadNotifications_follow();
    } else if (cardType === 'share') {
      this.showSharedBox = true;
      // เรียก API แยกเพื่อเช็คสถานะ
      this.loadNotifications_share();
    } else if (cardType === 'comment') {
      this.showCommentBox = true;
      // เรียก API แยกเพื่อเช็คสถานะ
      this.loadNotifications_comment();
    } else if (cardType === 'unban') {
      // unban ยังคงต้องโหลดแยก เพราะไม่ได้รวมใน API ใหม่
      this.loadNotificationsUnban();
    }
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

  // ฟังก์ชันใหม่: Mark as read การแจ้งเตือนทั้งหมด
  markAllNotificationsAsRead(): void {
    if (!this.validateCurrentUser()) return;

    this.notificationService.markAllNotificationsAsRead(this.userId).subscribe({
      next: (response) => {
        console.log('All notifications marked as read:', response);
        
        // อัปเดตสถานะ notify เป็น 1 (หรือ 0 ตามที่ backend ใช้) ในข้อมูลที่มีอยู่
        this.notifications.forEach(noti => noti.notify = 1);
        this.notificationsFollow.forEach(noti => noti.notify = 0); // follow ใช้ notify = 0
        this.notificationsShare.forEach(noti => noti.notify = 1);
        this.notificationsComment.forEach(noti => noti.notify = 1);
        
        // อัปเดตจำนวนการแจ้งเตือนที่ยังไม่อ่าน
        this.updateUnreadCount();
        this.updateUnreadFollowCount();
        this.updateUnreadShareCount();
        this.updateUnreadCommentCount();
        this.updateNotificationCounts();
        
        // อัปเดต global notification service
        if (this.userId) {
          this.globalNotificationService.refreshImmediately(Number(this.userId));
        }
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  // ฟังก์ชันโหลดการแจ้งเตือนแบบไลค์ (แยก)
  private loadNotifications_like(): void {
    if (!this.validateCurrentUser()) return;
    
    this.notificationService.Noti_Like(Number(this.userId)).subscribe({
      next: (response: any) => {
        this.notifications = response.likes || [];
        this.updateUnreadCount();
        
        // หาไลค์ล่าสุด
        if (this.notifications.length > 0) {
          this.latestLikerName = this.notifications[0].username;
        } else {
          this.latestLikerName = '';
        }
        this.showLikersBox = true;
      },
      error: (error: any) => {
        console.error('Error loading like notifications:', error);
        this.notifications = [];
        this.showLikersBox = false;
      }
    });
  }

  // ฟังก์ชันโหลดการแจ้งเตือนแบบติดตาม (แยก)
  private loadNotifications_follow(): void {
    if (!this.validateCurrentUser()) return;
    
    this.notificationService.Noti_Follow(Number(this.userId)).subscribe({
      next: (response: any) => {
        this.notificationsFollow = response.follows || [];
        this.showFollowersBox = true;
        
        // หาผู้ติดตามล่าสุด
        if (this.notificationsFollow.length > 0) {
          this.latestFollowerName = this.notificationsFollow[0].username;
        } else {
          this.latestFollowerName = '';
        }
        this.unreadFollowCount = this.notificationsFollow.filter(noti => noti.notify === 1).length;
      },
      error: (error: any) => {
        console.error('Error loading follow notifications:', error);
        this.notificationsFollow = [];
        this.showFollowersBox = false;
      }
    });
  }

  // ฟังก์ชันโหลดการแจ้งเตือนแบบแชร์ (แยก)
  private loadNotifications_share(): void {
    if (!this.validateCurrentUser()) return;
    
    this.notificationService.Noti_Shared(Number(this.userId)).subscribe({
      next: (response: any) => {
        this.notificationsShare = response.shares || [];
        this.showSharedBox = true;
        
        // หาการแชร์ล่าสุด
        const unreadShares = this.notificationsShare.filter(noti => noti.notify === 0);
        this.unreadShareCount = unreadShares.length;
        if (unreadShares.length > 0) {
          this.latestSharedName = unreadShares[0].username;
        } else {
          this.latestSharedName = '';
        }
      },
      error: (error: any) => {
        console.error('Error loading share notifications:', error);
        this.notificationsShare = [];
        this.showSharedBox = false;
      }
    });
  }

  // ฟังก์ชันโหลดการแจ้งเตือนแบบคอมเมนต์ (แยก)
  private loadNotifications_comment(): void {
    if (!this.validateCurrentUser()) return;
    
    this.notificationService.Noti_Comment(Number(this.userId)).subscribe({
      next: (response: any) => {
        this.notificationsComment = response.comments || [];
        this.showCommentBox = true;
        
        // หาคอมเมนต์ล่าสุด
        const unreadComments = this.notificationsComment.filter(noti => noti.notify === 0);
        this.unreadCommentCount = unreadComments.length;
        if (unreadComments.length > 0) {
          this.latestCommenterName = unreadComments[0].username;
        } else {
          this.latestCommenterName = '';
        }
      },
      error: (error: any) => {
        console.error('Error loading comment notifications:', error);
        this.notificationsComment = [];
        this.showCommentBox = false;
      }
    });
  }

  loadNotificationsUnban(): void {
    this.notificationService.Noti_Unban(Number(this.userId)).subscribe({
      next: (res) => {
        this.notificationsUnban = res.unban || [];

        // นับเฉพาะแจ้งเตือนที่ยังไม่อ่าน (status === "1")
        this.unreadUnbanCount = this.notificationsUnban.filter(n => n.status === "1").length;
        
        // อัปเดต notificationCounts หลังจากโหลด unban เสร็จ
        this.updateNotificationCounts();
        
        console.log('Unban notifications loaded:', {
          total: this.notificationsUnban.length,
          unread: this.unreadUnbanCount,
          finalCounts: this.notificationCounts
        });
      },
      error: (err) => {
        console.error('Error loading unban notifications:', err);
        this.notificationsUnban = [];
        this.unreadUnbanCount = 0;
        
        // อัปเดต notificationCounts แม้จะเกิด error
        this.updateNotificationCounts();
      }
    });
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