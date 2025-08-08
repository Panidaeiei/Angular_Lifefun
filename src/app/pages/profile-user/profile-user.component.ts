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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { combineLatest, filter, switchMap, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/Userservice';
import { FollowersDialogComponent } from '../../components/followers-dialog/followers-dialog.component';

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
    MatDialogModule,
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
    private router: Router,
    private auth: AuthService,
    private userService: UserService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    // 1) ต้องมี token + userId ใน storage เท่านั้น
    if (!this.auth.isTokenValid()) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/ProfileUser' } });
      return;
    }
    
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    this.checkScreenSize();
    
    // โหลด currentUserId จาก localStorage ก่อน
    this.userService.loadCurrentUserId();
    
    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
    }
    
    // Subscribe เฉพาะ params ที่มี id เท่านั้น
    this.route.queryParams
      .pipe(filter(params => !!params['id']))
      .subscribe((params) => {
        this.userId = params['id'];
      });

    // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน - แบบเร็วขึ้น
    this.userService.getCurrentUserId().subscribe((currentUserId: string | null) => {
      const urlUserId = this.route.snapshot.queryParams['id'];
      
      if (urlUserId && currentUserId && urlUserId !== currentUserId) {
        // ถ้า id ใน url ไม่ตรงกับ id ที่ล็อกอินไว้ ให้ redirect ออก
        this.router.navigate(['/login']);
        return;
      } else if (urlUserId && currentUserId && urlUserId === currentUserId) {
        // โหลดข้อมูลทันทีหลังจากตรวจสอบผ่านแล้ว
        this.loadUserDataFast();
      }
    });
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
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        this.isLoading = false;
      }
    );
  }

  getUserPosts(): void {
    this.profileService.getUserPostsById(this.userId).subscribe(
      (data) => {
        // ตรวจสอบและกรองข้อมูลก่อนอัปเดต
        this.posts = data.userPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false // กำหนดค่าเริ่มต้นถ้าไม่มี
        }));
      },
      (error) => {
        console.error('Error fetching user posts:', error);
      }
    );
  }

  getSharedPosts(): void {
    this.profileService.getUserPostsById(this.userId).subscribe(
      (data) => {
        this.sharedPosts = data.sharedPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
      },
      (error) => {
        console.error('Error fetching shared posts:', error);
      }
    );
  }

  getSavePosts(): void {
    this.profileService.getUserPostsById(this.userId).subscribe(
      (data) => {
        this.savePosts = data.savedPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
      },
      (error) => {
        console.error('Error fetching saved posts:', error);
      }
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  loadFollowCount(): void {
    const targetId = this.userId || this.followedId; // ใช้ userId ถ้าเป็นโปรไฟล์ตัวเอง

    if (!targetId) {
      return;
    }

    this.reactPostservice.getFollowCount(targetId).subscribe(
      (response) => {
        this.followersCount = response.followers;
        this.followingCount = response.following;
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดขณะโหลดจำนวนผู้ติดตาม:', error);
      }
    );
  }

  // แยกฟังก์ชันสำหรับโหลดข้อมูลผู้ใช้
  private loadUserData(): void {
    if (this.userId) {
      this.isLoading = true;
      
      // โหลด user profile ตาม userId ที่อยู่ใน URL
      this.profileService.getUserProfileById(this.userId).subscribe(
        user => {
          this.user = user;
          
          // โหลดข้อมูลอื่นๆต่อ เช่น post, follow ฯลฯ
          this.loadAllUserData();
          
          // เริ่มการติดตามการแจ้งเตือน
          this.startNotificationTracking();
        },
        error => {
          this.isLoading = false;
          console.error('❌ Error loading user profile:', error);
        }
      );
    } else {
      console.warn('⚠️ ไม่มี User ID สำหรับโหลดข้อมูล');
    }
  }

  // ฟังก์ชันใหม่สำหรับโหลดข้อมูลทั้งหมดพร้อมกัน
  private loadAllUserData(): void {
    if (!this.userId) {
      console.warn('⚠️ ไม่มี User ID สำหรับโหลดข้อมูล');
      this.isLoading = false;
      return;
    }

    // สร้าง observable สำหรับโหลดข้อมูลทั้งหมดพร้อมกัน
    const userPosts$ = this.profileService.getUserPostsById(this.userId).pipe(
      catchError(error => {
        console.error('Error loading user posts:', error);
        return of({ userPosts: [], sharedPosts: [], savedPosts: [] });
      })
    );

    const followCount$ = this.reactPostservice.getFollowCount(this.userId).pipe(
      catchError(error => {
        console.error('Error loading follow count:', error);
        return of({ followers: 0, following: 0 });
      })
    );

    // โหลดข้อมูลทั้งหมดพร้อมกัน
    forkJoin({
      posts: userPosts$,
      followCount: followCount$
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data) => {
        // อัปเดตข้อมูลโพสต์
        this.posts = data.posts.userPosts.map((post: any) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
        
        this.sharedPosts = data.posts.sharedPosts.map((post: any) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
        
        this.savePosts = data.posts.savedPosts.map((post: any) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));

        // อัปเดตข้อมูลการติดตาม
        this.followersCount = data.followCount.followers;
        this.followingCount = data.followCount.following;
      },
      error: (error) => {
        console.error('❌ Error loading all user data:', error);
        this.isLoading = false;
      }
    });
  }

  // ฟังก์ชันใหม่สำหรับโหลดข้อมูลแบบเร็ว (เหมือนหน้าโปรไฟล์ผู้อื่น)
  private loadUserDataFast(): void {
    if (this.userId) {
      this.isLoading = true;
      
      // โหลดข้อมูลทั้งหมดพร้อมกันแบบเร็ว
      const userProfile$ = this.profileService.getUserProfileById(this.userId).pipe(
        catchError(error => {
          console.error('Error loading user profile:', error);
          return of(null);
        })
      );

      const userPosts$ = this.profileService.getUserPostsById(this.userId).pipe(
        catchError(error => {
          console.error('Error loading user posts:', error);
          return of({ userPosts: [], sharedPosts: [], savedPosts: [] });
        })
      );

      const followCount$ = this.reactPostservice.getFollowCount(this.userId).pipe(
        catchError(error => {
          console.error('Error loading follow count:', error);
          return of({ followers: 0, following: 0 });
        })
      );

      // โหลดข้อมูลทั้งหมดพร้อมกัน
      forkJoin({
        profile: userProfile$,
        posts: userPosts$,
        followCount: followCount$
      }).pipe(
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe({
        next: (data) => {
          // อัปเดตข้อมูลผู้ใช้
          this.user = data.profile;
          
          // อัปเดตข้อมูลโพสต์
          this.posts = data.posts.userPosts.map((post: any) => ({
            ...post,
            hasMultipleMedia: post.hasMultipleMedia || false
          }));
          
          this.sharedPosts = data.posts.sharedPosts.map((post: any) => ({
            ...post,
            hasMultipleMedia: post.hasMultipleMedia || false
          }));
          
          this.savePosts = data.posts.savedPosts.map((post: any) => ({
            ...post,
            hasMultipleMedia: post.hasMultipleMedia || false
          }));

          // อัปเดตข้อมูลการติดตาม
          this.followersCount = data.followCount.followers;
          this.followingCount = data.followCount.following;
          
          // เริ่มการติดตามการแจ้งเตือน
          this.startNotificationTracking();
        },
        error: (error) => {
          console.error('❌ Error loading user data fast:', error);
          this.isLoading = false;
        }
      });
    } else {
      console.warn('⚠️ ไม่มี User ID สำหรับโหลดข้อมูล');
      this.isLoading = false;
    }
  }

  logout() {
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

  // ฟังก์ชันเปิด popup แสดงรายชื่อผู้ติดตาม
  openFollowersPopup(): void {
    const dialogRef = this.dialog.open(FollowersDialogComponent, {
      width: '400px',
      maxHeight: '70vh',
      data: { userId: this.userId, type: 'followers' }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog closed
    });
  }

  // ฟังก์ชันเปิด popup แสดงรายชื่อผู้ที่เราติดตาม
  openFollowingPopup(): void {
    const dialogRef = this.dialog.open(FollowersDialogComponent, {
      width: '400px',
      maxHeight: '70vh',
      data: { userId: this.userId, type: 'following' }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog closed
    });
  }
}
