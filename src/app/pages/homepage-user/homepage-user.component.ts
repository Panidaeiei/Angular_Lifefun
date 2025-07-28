import { Component, HostListener, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ShowPost } from '../../models/showpost_model';
import { UserService } from '../../services/Userservice';
import { PostService } from '../../services/Postservice';
import { ReactPostservice } from '../../services/ReactPostservice';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { filter } from 'rxjs/operators';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-homepage-user',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatTooltipModule, MatBadgeModule, TimeAgoPipe],
  templateUrl: './homepage-user.component.html',
  styleUrl: './homepage-user.component.scss',
})
export class HomepageUserComponent implements OnDestroy {
  currentUserId: string | null = null;
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด
  message: string = '';
  postId: string = '';
  viewPosts: any[] = [];
  isMobile: boolean = false; // เพิ่มตัวแปรสำหรับตรวจสอบ mobile
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
    // ตรวจสอบการเข้าสู่ระบบก่อน
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login']);
      return;
    }
    this.checkScreenSize();
    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
      console.log('User ID from snapshot:', this.userId);
      this.loadUserData();
    }
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

    this.likePostService.likeStatus$.subscribe((status) => {
      console.log("Like status updated:", status);
      // ดำเนินการที่ต้องการเมื่อไลค์เปลี่ยนแปลง
    });

    this.posts.forEach((post) => {
      this.checkLikeStatus(post.post_id);
    });

    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;

      // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
      const urlUserId = this.route.snapshot.queryParams['id'];
      if (urlUserId && userId && urlUserId !== userId) {
        // ถ้า id ใน url ไม่ตรงกับ id ที่ล็อกอินไว้ ให้ redirect ออก
        this.router.navigate(['/login']); // หรือหน้า error อื่น ๆ ตามต้องการ
        return;
      }
    });

    this.userService.loadCurrentUserId();

    // ดึงโพสต์จาก Backend
    this.fetchPosts();

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

  // แยกฟังก์ชันสำหรับโหลดข้อมูลผู้ใช้
  private loadUserData(): void {
    if (this.userId) {
      // โหลดข้อมูลผู้ใช้ปัจจุบัน
      this.userService.getCurrentUserId().subscribe((userId) => {
        this.currentUserId = userId;
        console.log('Current User ID:', this.currentUserId);
      });
      
      this.userService.loadCurrentUserId();
      
      // โหลดโพสต์
      this.fetchPosts();
    }
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

  // เพิ่มฟังก์ชันตรวจสอบขนาดหน้าจอ
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  getViewsForPost(postId: string): number {
    const postIdString = postId.toString();
  
    // ค้นหาข้อมูลใน viewPosts โดยเปรียบเทียบ post_id
    const view = this.viewPosts.find(v => v.post_id.toString() === postIdString);
    
    // console.log('View Post ID:', postId, 'View Data:', view); 
  
    // ถ้าไม่พบให้แสดงเป็น 0
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

  fetchPosts(): void {
    this.postService.getPosts_interests().subscribe(
      (response: ShowPost[]) => {
        console.log('Response from API:', response);  // ตรวจสอบข้อมูลที่ได้รับจาก API

        // กรองโพสต์ที่มี `post_id` ซ้ำ
        const uniquePosts = response.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.post_id === value.post_id
          ))
        );

        // อัปเดตค่า posts ที่กรองแล้ว
        this.posts = uniquePosts;

        // เพียงแค่ใช้ค่าของ hasMultipleMedia ที่มาจาก API
        this.posts.forEach(post => {
          console.log('Has Multiple Media:', post.hasMultipleMedia);  // ตรวจสอบสถานะ hasMultipleMedia
        });
      },
      (error) => {
        console.error('Error fetching posts:', error);
      }
    );
  }
  
  toggleHeart(post: ShowPost): void {
    if (!this.currentUserId) {
      console.error('User ID not found');
      return;
    }

    this.likePostService.likePost(post.post_id, Number(this.currentUserId)).subscribe({
      next: (response) => {
        console.log('Like response:', response);
        post.isLiked = response.isLiked;
        post.likes_count = response.likeCount;
        
        // อัปเดตการแจ้งเตือนแบบทันทีหลังจากไลค์
        if (this.userId) {
          // ใช้ refreshImmediately แทน loadNotificationCounts เพื่อความเร็ว
          this.notificationService.refreshImmediately(Number(this.userId));
          
          // ถ้าเป็นการไลค์ (ไม่ใช่การเลิกไลค์) ให้เพิ่มการแจ้งเตือนทันที
          if (response.isLiked) {
            this.notificationService.addNotificationImmediately('like');
          }
        }
      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  goToProfile(userId: string): void {
    if (!userId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }
  
      this.router.navigate(['/view_user', this.currentUserId], { queryParams: { Profileuser: userId } });
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  checkLikeStatus(postId: number): void {
    this.likePostService.checkLikeStatus(postId).subscribe({
      next: (response) => {
        console.log('Like status for post', postId, ':', response);
      },
      error: (error) => {
        console.error('Error checking like status:', error);
      }
    });
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
