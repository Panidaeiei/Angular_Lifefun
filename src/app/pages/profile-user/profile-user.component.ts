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
import { filter, forkJoin, of } from 'rxjs';
import { catchError, finalize, take, timeout } from 'rxjs/operators';
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
  standalone: true,
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
  isDrawerOpen: boolean = false;
  user: User | null = null;
  posts: Postme[] = [];
  isLoading = true;
  sharedPosts: Postme[] = [];
  savePosts: Postme[] = [];
  userProfile: User | null = null;
  viewerId: string = '';
  followersCount: number = 0;
  followingCount: number = 0;
  followedId: string = '';
  isMobile: boolean = false;
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  
  // เพิ่มตัวแปรเพื่อป้องกันการโหลดซ้ำ
  private isDataLoaded = false;
  private subscriptions = new Subscription();
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
    // ตรวจสอบ authentication ก่อน
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
    
    // โหลด currentUserId จาก localStorage
    this.userService.loadCurrentUserId();
    
    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
    }
    
    // Subscribe เฉพาะ params ที่มี id เท่านั้น และป้องกันการโหลดซ้ำ
    const routeSub = this.route.queryParams
      .pipe(
        filter(params => !!params['id']),
        take(1) // รับค่าแค่ครั้งแรก
      )
      .subscribe((params) => {
        if (!this.isDataLoaded) {
          this.userId = params['id'];
        }
      });
    
    this.subscriptions.add(routeSub);

    // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
    const userSub = this.userService.getCurrentUserId()
      .pipe(take(1)) // รับค่าแค่ครั้งเดียว
      .subscribe((currentUserId: string | null) => {
        const urlUserId = this.route.snapshot.queryParams['id'];
        
        if (urlUserId && currentUserId && urlUserId !== currentUserId) {
          this.router.navigate(['/login']);
          return;
        } else if (urlUserId && currentUserId && urlUserId === currentUserId && !this.isDataLoaded) {
          // โหลดข้อมูลเฉพาะครั้งแรก
          this.loadUserDataFast();
        }
      });
    
    this.subscriptions.add(userSub);
  }

  // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId && !this.notificationSubscription) {
      // โหลดข้อมูลจาก localStorage เท่านั้น
      this.loadNotificationCountsFromStorage();
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
    if (this.isDataLoaded) return; // ป้องกันการโหลดซ้ำ
    
    this.profileService.getUserProfile()
      .pipe(
        timeout(10000), // timeout 10 วินาที
        take(1)
      )
      .subscribe({
        next: (data) => {
          this.user = data;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.isLoading = false;
        }
      });
  }

  getUserPosts(): void {
    if (this.isDataLoaded) return; // ป้องกันการโหลดซ้ำ
    
    this.profileService.getUserPostsById(this.userId)
      .pipe(
        timeout(10000),
        take(1)
      )
      .subscribe({
        next: (data) => {
          this.posts = data.userPosts.map((post) => ({
            ...post,
            hasMultipleMedia: post.hasMultipleMedia || false
          }));
        },
        error: (error) => {
          console.error('Error loading posts:', error);
        }
      });
  }

  getSharedPosts(): void {
    if (this.isDataLoaded) return; // ป้องกันการโหลดซ้ำ
    
    this.profileService.getUserPostsById(this.userId)
      .pipe(
        timeout(10000),
        take(1)
      )
      .subscribe({
        next: (data) => {
          this.sharedPosts = data.sharedPosts.map((post) => ({
            ...post,
            hasMultipleMedia: post.hasMultipleMedia || false
          }));
        },
        error: (error) => {
          console.error('Error loading shared posts:', error);
        }
      });
  }

  getSavePosts(): void {
    if (this.isDataLoaded) return; // ป้องกันการโหลดซ้ำ
    
    this.profileService.getUserPostsById(this.userId)
      .pipe(
        timeout(10000),
        take(1)
      )
      .subscribe({
        next: (data) => {
          this.savePosts = data.savedPosts.map((post) => ({
            ...post,
            hasMultipleMedia: post.hasMultipleMedia || false
          }));
        },
        error: (error) => {
          console.error('Error loading saved posts:', error);
        }
      });
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  // ไม่ต้องมี loadFollowCount() แล้ว เพราะข้อมูล followers และ following มาพร้อมกับ getUserProfileById

  // ฟังก์ชันใหม่สำหรับโหลดข้อมูลแบบเร็ว
  private loadUserDataFast(): void {
    if (this.userId && !this.isDataLoaded) {
      this.isLoading = true;
      this.isDataLoaded = true; // ป้องกันการโหลดซ้ำ
      
      // โหลดข้อมูลทั้งหมดพร้อมกันแบบเร็ว
      const userProfile$ = this.profileService.getUserProfileById(this.userId).pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error loading profile:', error);
          return of(null);
        }),
        take(1)
      );

      const userPosts$ = this.profileService.getUserPostsById(this.userId).pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error loading posts:', error);
          return of({ userPosts: [], sharedPosts: [], savedPosts: [] });
        }),
        take(1)
      );

      // ไม่ต้องเรียก getFollowCount() แยกแล้ว เพราะข้อมูล followers และ following มาพร้อมกับ getUserProfileById

      // โหลดข้อมูลทั้งหมดพร้อมกัน
      forkJoin({
        profile: userProfile$,
        posts: userPosts$
      }).pipe(
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe({
        next: (data) => {
          // อัปเดตข้อมูลผู้ใช้
          this.user = data.profile;
          
          // อัปเดตข้อมูลการติดตามจาก profile data
          this.followersCount = data.profile?.followers || 0;
          this.followingCount = data.profile?.following || 0;
          
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
          
          // เริ่มการติดตามการแจ้งเตือน
          this.startNotificationTracking();
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.isLoading = false;
        }
      });
    } else {
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
    // ยกเลิก subscriptions ทั้งหมด
    this.subscriptions.unsubscribe();
    
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

  // เพิ่มฟังก์ชันโหลดข้อมูลจาก localStorage
  private loadNotificationCountsFromStorage(): void {
    const storedCounts = localStorage.getItem(`notificationCounts_${this.userId}`);
    if (storedCounts) {
      try {
        this.notificationCounts = JSON.parse(storedCounts);
        console.log('Loaded notification counts from storage:', this.notificationCounts);
      } catch (error) {
        console.error('Error parsing stored notification counts:', error);
      }
    }
  }
}