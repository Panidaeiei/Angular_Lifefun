import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest, filter, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { NotificationService, NotificationCounts } from '../../services/notification.service';

@Component({
  selector: 'app-profile-user',
  standalone: true, // ใช้ standalone component
  imports: [
    MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
})
export class ProfileUserComponent implements OnInit, OnDestroy {
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  user: User | null = null; // เก็บข้อมูลผู้ใช้
  posts: Postme[] = [];
  isLoading = true;
  sharedPosts: Postme[] = [];
  savePosts: Postme[] = [];
  userProfile: User | null = null;
  viewerId: string = '';
  followersCount: number = 0;
  followingCount: number = 0;
  followedId: string = '';
  isMobile: boolean = false; // เพิ่มตัวแปรนี้
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
    private route: ActivatedRoute, 
    private profileService: ProfileService, 
    private reactPostservice: ReactPostservice, 
    private notificationService: NotificationService,
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
    // Subscribe เฉพาะ params ที่มี id และโหลดข้อมูล user/profile
    this.route.queryParams
      .pipe(
        filter(params => !!params['id']),
        switchMap(params => {
        this.userId = params['id'];
        console.log('User ID:', this.userId);
          this.isLoading = true;
          // โหลด user profile
          return this.profileService.getUserProfile();
        })
      )
      .subscribe(
        user => {
          this.user = user;
          this.isLoading = false;
          // โหลดข้อมูลอื่นๆต่อ เช่น post, follow ฯลฯ
        this.getUserPosts();
        this.getSharedPosts();
        this.getSavePosts();
        this.loadFollowCount();
        
        // เริ่มการติดตามการแจ้งเตือน
        this.startNotificationTracking();
        },
        error => {
          this.isLoading = false;
          // handle error
      }
      );
  }

  // เริ่มการติดตามการแจ้งเตือน
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
          console.log('Notification counts updated:', counts);
        }
      );
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  // ดึงข้อมูลโปรไฟล์ผู้ใช้
  getUserProfile(): void {
    this.profileService.getUserProfile().subscribe(
      (data) => {
        this.user = data; // เก็บข้อมูลผู้ใช้
        console.log('User data:', this.user);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        this.isLoading = false;
      }
    );
  }

  getUserPosts(): void {
    this.profileService.getPostsMe().subscribe(
      (data) => {
        // ตรวจสอบและกรองข้อมูลก่อนอัปเดต
        this.posts = data.userPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false // กำหนดค่าเริ่มต้นถ้าไม่มี
        }));
        console.log('User posts:', this.posts);
      },
      (error) => {
        console.error('Error fetching user posts:', error);
      }
    );
  }

  getSharedPosts(): void {
    this.profileService.getPostsMe().subscribe(
      (data) => {
        this.sharedPosts = data.sharedPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
        console.log('Shared posts:', this.sharedPosts);
      },
      (error) => {
        console.error('Error fetching shared posts:', error);
      }
    );
  }

  getSavePosts(): void {
    this.profileService.getPostsMe().subscribe(
      (data) => {
        this.savePosts = data.savedPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
        console.log('Shared posts:', this.savePosts);
      },
      (error) => {
        console.error('Error fetching shared posts:', error);
      }
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  loadFollowCount(): void {
    const targetId = this.userId || this.followedId; // ใช้ userId ถ้าเป็นโปรไฟล์ตัวเอง

    if (!targetId) {
      console.warn('⚠️ ไม่สามารถโหลดข้อมูลติดตามได้: ไม่มี userId หรือ followedId');
      return;
    }

    this.reactPostservice.getFollowCount(targetId).subscribe(
      (response) => {
        this.followersCount = response.followers;
        this.followingCount = response.following;
        console.log(`จำนวนผู้ติดตาม: ${this.followersCount}, จำนวนที่ติดตาม: ${this.followingCount}`);
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดขณะโหลดจำนวนผู้ติดตาม:', error);
      }
    );
  }

  // แยกฟังก์ชันสำหรับโหลดข้อมูลผู้ใช้
  private loadUserData(): void {
    if (this.userId) {
      // เรียกฟังก์ชันเมื่อมีค่า userId
      this.getUserProfile();
      this.getUserPosts();
      this.getSharedPosts();
      this.getSavePosts();
      this.loadFollowCount();
    }
  }

  logout(): void {
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

  ngOnDestroy(): void {
    // หยุดการติดตามการแจ้งเตือน
    this.notificationService.stopAutoUpdate();
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}
