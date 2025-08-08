import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../services/Userservice';
import { PostService } from '../../services/Postservice';
import { ShowPost } from '../../models/showpost_model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { filter } from 'rxjs/operators';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home-follow',
  standalone: true,
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule,MatButtonModule,MatCardModule,MatTooltipModule, TimeAgoPipe ],
  templateUrl: './home-follow.component.html',
  styleUrl: './home-follow.component.scss'
})
export class HomeFollowComponent implements OnDestroy {
  currentUserId: string | null = null;
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; 
  posts: ShowPost[] = []; 
  message: string = '';
  postId: string = '';
  viewPosts: any[] = [];
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
    private userService: UserService, 
    private postService: PostService, 
    private likePostService: ReactPostservice, 
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
    this.checkScreenSize(); // ตรวจสอบขนาดหน้าจอเมื่อเริ่มต้น
    
    // ตรวจสอบ query parameters จาก snapshot ก่อน
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
      console.log('User ID from snapshot:', this.userId);
      this.loadUserData();
    }
    
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      console.log('Current User ID:', this.currentUserId);
      
      // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
      const urlUserId = this.route.snapshot.queryParams['id'];
      if (urlUserId && userId && urlUserId !== userId) {
        console.log('❌ URL User ID ไม่ตรงกับ Current User ID - Redirecting to login');
        this.router.navigate(['/login']);
        return;
      } else if (urlUserId && userId && urlUserId === userId) {
        console.log('✅ URL User ID ตรงกับ Current User ID - เข้าถึงได้');
      }
    });
    
    // Subscribe เฉพาะ params ที่มี id เท่านั้น
    this.route.queryParams
      .pipe(filter(params => !!params['id']))
      .subscribe((params) => {
        this.userId = params['id'];
        console.log('User ID from observable:', this.userId);
        this.loadUserData();
    });

    this.route.queryParamMap.subscribe(params => {
      const viewerId = params.get('viewerId');
      console.log('Viewer ID (ผู้ใช้ที่กำลังดู):', viewerId);
    });

    this.posts.forEach((post) => {
      this.checkLikeStatus(post.post_id);
    });

    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;

    });

    this.userService.loadCurrentUserId();

    this.loadPosts(); 

    this.postService.getViewCounts().subscribe({
      next: (data) => {
        this.viewPosts = data;
        console.log('View Data:', data);
      },
      error: (err) => {
        console.error('Error loading views:', err);
      }
    });

    // เริ่มการติดตามการแจ้งเตือน
    this.startNotificationTracking();
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

  // แยกฟังก์ชันสำหรับโหลดข้อมูลผู้ใช้
  private loadUserData(): void {
    if (this.userId) {
      this.userService.loadCurrentUserId();
      this.loadPosts();
    }
  }

  loadPosts(): void {
    this.postService.getPostsFollowing().subscribe(
      (posts: ShowPost[]) => {
        this.posts = posts;  
      },
      (error) => {
        console.error('Error loading posts:', error);
      }
    );
  }

  getViewsForPost(postId: string): number {
    const postIdString = postId.toString();
  
    // ค้นหาข้อมูลใน viewPosts โดยเปรียบเทียบ post_id
    const view = this.viewPosts.find(v => v.post_id.toString() === postIdString);
    
    // console.log('View Post ID:', postId, 'View Data:', view); 
  
    return view?.total_views ? parseInt(view.total_views) : 0; 
  }
  
  viewPost(postId: string): void {
    this.postService.viewPost(postId).subscribe({
      next: () => {
        // เมื่อ API viewPost สำเร็จแล้ว ค่อยเปลี่ยนหน้า
        this.router.navigate(['/detail_post'], { queryParams: { post_id: postId, user_id: this.currentUserId } });
      },
      error: (err) => console.error('Error updating view count:', err)
    });
  }

  checkLikeStatus(postId: number): void {
    this.likePostService.checkLikeStatus(postId).subscribe(
      (response) => {
        // ตั้งค่าการไลค์สำหรับโพสต์นี้
        const post = this.posts.find(p => p.post_id === postId);
        if (post) {
          post.isLiked = response.liked;  // อัปเดตสถานะการไลค์ของโพสต์
        }
      },
      (error) => {
        console.error('Error checking like status:', error);
      }
    );
  }

  
  goToProfile(userId: string): void {
    console.log('Current User ID:', this.currentUserId);
    console.log('Navigating to:', userId);
    console.log('Query Params ID:', this.userId);
  
    if (!userId || !this.currentUserId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }
  
    if (userId === this.currentUserId) {
      // หาก userId คือ currentUserId, ไปที่หน้าประวัติของผู้ใช้ (ProfileUser)
      this.router.navigate(['/ProfileUser'], { queryParams: { id: this.currentUserId } });
    } else {
      // หาก userId ไม่เหมือน currentUserId, ไปที่หน้าผู้ใช้ที่กำลังดู (view_user) พร้อม queryParams สำหรับ viewerId
      this.router.navigate(['/view_user', this.currentUserId], { queryParams: { Profileuser: userId } });
    }
  }

  toggleHeart(post: ShowPost): void {
    const userId = this.userId;  
    console.log('userId Like:', userId); 

    // เปลี่ยนสถานะ isLiked
    post.isLiked = !post.isLiked;
    console.log('Heart icon clicked for post:', post.post_id, 'Liked:', post.isLiked);

    // เรียกใช้ LikePostService เพื่ออัปเดตสถานะการไลค์ในฐานข้อมูล
    this.likePostService.likePost(post.post_id, Number(userId)).subscribe(
      (response) => {
        console.log('Post liked successfully:', response);
        post.likes_count = response.likes_count;  // อัปเดตยอดไลค์
      },
      (error) => {
        console.error('Error liking post:', error);
      }
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
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
}
