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
import { NotificationEventService } from '../../services/notification-event.service';
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
  notificationCounts: any = {
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
    private notificationService: NotificationEventService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('HomeFollowComponent ngOnInit started');
    
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    console.log('Logged in userId:', loggedInUserId);
    console.log('Token exists:', !!token);
    
    if (!loggedInUserId || !token) {
      console.error('Missing userId or token, redirecting to login');
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    
    this.checkScreenSize(); // ตรวจสอบขนาดหน้าจอเมื่อเริ่มต้น
    
    // ตรวจสอบ query parameters จาก snapshot ก่อน
    const snapshotParams = this.route.snapshot.queryParams;
    console.log('Snapshot params:', snapshotParams);
    
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
      console.log('Using userId from URL:', this.userId);
      // ตรวจสอบว่า userId ใน URL ตรงกับ userId ที่ล็อกอิน
      if (this.userId !== loggedInUserId) {
        console.error('URL userId mismatch, redirecting to login');
        // ถ้าไม่ตรงกัน ให้เด้งไปหน้า login ทันที
        this.clearStoredData();
        this.router.navigate(['/login'], { 
          queryParams: { error: 'uid_mismatch' },
          replaceUrl: true // ลบ URL เก่าออก
        });
        return;
      }
    } else {
      // ถ้าไม่มี id ใน URL ให้ใช้ userId ที่ล็อกอิน
      this.userId = loggedInUserId;
      console.log('Using logged in userId:', this.userId);
    }
    
    console.log('Final userId set to:', this.userId);
    
    // เรียก API แค่ครั้งเดียว
    this.loadUserData();
    
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      
      // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
      const urlUserId = this.route.snapshot.queryParams['id'];
      if (urlUserId && userId && urlUserId !== userId) {
        this.router.navigate(['/login']);
        return;
      }
    });
    
    // ลบ subscription ที่ทำให้เรียก API ซ้ำออก
    // this.route.queryParams.subscribe() - ลบออก

    this.route.queryParamMap.subscribe(params => {
      const viewerId = params.get('viewerId');
    });

    this.posts.forEach((post) => {
      // ลบการเรียก API checkLikeStatus ทุกโพสต์ออก
      // this.checkLikeStatus(post.post_id);
    });

    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;

    });

    this.userService.loadCurrentUserId();

    // โหลด view counts ครั้งเดียว
    this.postService.getViewCounts().subscribe({
      next: (data) => {
        this.viewPosts = data;
        // บันทึกลง localStorage เพื่อใช้ครั้งต่อไป
        if (this.userId) {
          localStorage.setItem(`viewCounts_${this.userId}`, JSON.stringify(data));
        }
      },
      error: (err) => {
        console.error('Error loading view counts:', err);
        // ถ้า API ล้มเหลว ให้โหลดจาก localStorage
        this.loadViewCountsFromStorage();
      }
    });

    // เริ่มการติดตามการแจ้งเตือน
    this.startNotificationTracking();
  }

  // เริ่มการติดตามการแจ้งเตือน - ใช้ Event Service แทน API
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดข้อมูลจาก localStorage ก่อน
      this.loadNotificationCountsFromStorage();
      
      // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือนจาก Event Service
      this.notificationSubscription = this.notificationService.counts.subscribe(
        (counts) => { 
          this.notificationCounts = counts;
          // บันทึกลง localStorage ทุกครั้งที่ได้ข้อมูลใหม่
          this.saveNotificationCountsToStorage();
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
      console.log('Loading user data for userId:', this.userId);
      this.userService.loadCurrentUserId();
      this.loadPosts();
    } else {
      console.error('userId is not set');
    }
  }

  loadPosts(): void {
    // เรียก API เพื่อโหลดโพสต์
    this.postService.getPostsFollowing().subscribe(
      (posts: ShowPost[]) => {
        this.posts = posts;
        
        // บันทึกลง localStorage เพื่อใช้ครั้งต่อไป
        if (this.userId) {
          localStorage.setItem(`followingPosts_${this.userId}`, JSON.stringify(posts));
        }
        
        // จัดการข้อมูลไฟล์หลายไฟล์ที่มาจาก Backend
        this.posts.forEach((post, index) => {
          console.log(`Processing post ${index}:`, post.post_id);
          console.log(`Post ${index} allMedia:`, post.allMedia);
          
          // ตรวจสอบและตั้งค่า currentImageIndex ถ้าไม่มี
          if (post.currentImageIndex === undefined) {
            post.currentImageIndex = 0;
          }
          
          // จัดการ allMedia และตั้งค่า media_url, media_type
          if (post.allMedia && post.allMedia.length > 0) {
            console.log(`Post ${index} has ${post.allMedia.length} media files`);
            
            // ตรวจสอบและเพิ่ม type ถ้าไม่มี
            post.allMedia.forEach((media, mediaIndex) => {
              if (!media.type) {
                // ถ้าไม่มี type ให้เดาว่าจาก URL
                if (media.url.includes('.mp4') || media.url.includes('.mov') || media.url.includes('.avi')) {
                  media.type = 'video';
                } else {
                  media.type = 'image';
                }
                console.log(`Post ${index} media ${mediaIndex} type set to:`, media.type);
              }
            });
            
            // จัดลำดับไฟล์ใหม่ (วิดีโอขึ้นก่อน รูปภาพตามหลัง)
            const reorderedMedia = this.reorderMediaFiles(post.allMedia);
            post.allMedia = reorderedMedia;
            
            // อัปเดต media_url และ media_type จากไฟล์แรก
            const firstMedia = post.allMedia[0];
            post.media_url = firstMedia.url;
            post.media_type = firstMedia.type as 'image' | 'video';
            console.log(`Post ${index} media_url set to:`, post.media_url);
            console.log(`Post ${index} media_type set to:`, post.media_type);
          } else {
            console.log(`Post ${index} has no allMedia or empty array`);
          }
        });
        
        console.log('Posts loaded successfully:', this.posts.length);
        console.log('First post allMedia:', this.posts[0]?.allMedia);
        console.log('First post media_url:', this.posts[0]?.media_url);
        console.log('First post media_type:', this.posts[0]?.media_type);
      },
      (error) => {
        console.error('Error loading posts:', error);
        // ถ้า API ล้มเหลว ให้โหลดจาก localStorage
        this.loadPostsFromStorage();
      }
    );
  }

  getViewsForPost(postId: string): number {
    const postIdString = postId.toString();
  
    // ค้นหาข้อมูลใน viewPosts โดยเปรียบเทียบ post_id
    const view = this.viewPosts.find(v => v.post_id.toString() === postIdString);
  
    return view?.total_views ? parseInt(view.total_views) : 0; 
  }
  
  viewPost(postId: string): void {
    // เรียก API viewPost เพื่ออัปเดตจำนวน views
    this.postService.viewPost(postId).subscribe({
      next: () => {
        // เมื่อ API viewPost สำเร็จแล้ว ค่อยเปลี่ยนหน้า
        this.router.navigate(['/detail_post'], { queryParams: { post_id: postId, user_id: this.currentUserId } });
      },
      error: (err) => {
        console.error('Error updating view count:', err);
        // ถ้า API ล้มเหลว ให้เปลี่ยนหน้าทันที
        this.router.navigate(['/detail_post'], { queryParams: { post_id: postId, user_id: this.currentUserId } });
      }
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
        // Error handling
      }
    );
  }

  
  goToProfile(userId: string): void {
    if (!userId || !this.currentUserId) {
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

    // เปลี่ยนสถานะ isLiked
    post.isLiked = !post.isLiked;

    // เรียกใช้ LikePostService เพื่ออัปเดตสถานะการไลค์ในฐานข้อมูล
    this.likePostService.likePost(post.post_id, Number(userId)).subscribe(
      (response) => {
        post.likes_count = response.likes_count;  // อัปเดตยอดไลค์
        
        // อัปเดตการแจ้งเตือนผ่าน Event Service
        if (this.userId && post.isLiked) {
          this.notificationService.addNotification('like', this.userId);
          console.log('Like notification added via Event Service');
        }
      },
      (error) => {
        // Error handling
      }
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  logout() {
    this.clearStoredData();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    // ไม่ต้องหยุดการติดตามการแจ้งเตือนอีกต่อไป - ใช้ localStorage เท่านั้น
    // this.notificationService.stopAutoUpdate();
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // ฟังก์ชันจัดการไฟล์หลายไฟล์
  private updateMediaDisplay(post: ShowPost): void {
    if (!post || !post.allMedia || post.allMedia.length === 0) return;

    // อัปเดต media_url และ media_type เป็นไฟล์ปัจจุบัน
    const currentIndex = post.currentImageIndex || 0;
    const currentMedia = post.allMedia[currentIndex];
    if (currentMedia) {
      post.media_url = currentMedia.url;
      post.media_type = currentMedia.type as 'image' | 'video';
    }
  }

  // ฟังก์ชันเลื่อนไปไฟล์ถัดไป
  nextMedia(post: ShowPost, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!post.allMedia || post.allMedia.length <= 1) return;

    const currentIndex = post.currentImageIndex || 0;
    post.currentImageIndex = (currentIndex + 1) % post.allMedia.length;
    this.updateMediaDisplay(post);
  }

  // ฟังก์ชันเลื่อนไปไฟล์ก่อนหน้า
  prevMedia(post: ShowPost, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!post.allMedia || post.allMedia.length <= 1) return;

    const currentIndex = post.currentImageIndex || 0;
    post.currentImageIndex = currentIndex === 0
      ? post.allMedia.length - 1
      : currentIndex - 1;
    this.updateMediaDisplay(post);
  }

  // ฟังก์ชันไปยังไฟล์ที่ระบุ
  goToMedia(post: ShowPost, index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!post.allMedia || index < 0 || index >= post.allMedia.length) return;

    post.currentImageIndex = index;
    this.updateMediaDisplay(post);
  }

  // เพิ่มฟังก์ชันการเลื่อนด้วยเมาส์
  private touchStartX: number = 0;
  private touchEndX: number = 0;

  onTouchStart(event: TouchEvent, post: ShowPost): void {
    if (!post.allMedia || post.allMedia.length <= 1) return;
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent, post: ShowPost): void {
    if (!post.allMedia || post.allMedia.length <= 1) return;
    this.touchEndX = event.changedTouches[0].clientX;
    this.handleSwipe(post);
  }

  onMouseDown(event: MouseEvent, post: ShowPost): void {
    if (!post.allMedia || post.allMedia.length <= 1) return;
    this.touchStartX = event.clientX;
    document.addEventListener('mouseup', (e) => this.onMouseUp(e, post), { once: true });
  }

  onMouseUp(event: MouseEvent, post: ShowPost): void {
    if (!post.allMedia || post.allMedia.length <= 1) return;
    this.touchEndX = event.clientX;
    this.handleSwipe(post);
  }

  private handleSwipe(post: ShowPost): void {
    const swipeThreshold = 50; // ความไวในการเลื่อน
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // เลื่อนไปขวา (ไฟล์ถัดไป)
        this.nextMedia(post);
      } else {
        // เลื่อนไปซ้าย (ไฟล์ก่อนหน้า)
        this.prevMedia(post);
      }
    }
  }

  // ฟังก์ชันจัดลำดับไฟล์ตาม logic ของ detail-post (วิดีโอขึ้นก่อน รูปภาพตามหลัง)
  private reorderMediaFiles(allMedia: { type: string; url: string }[]): { type: string; url: string }[] {
    if (!allMedia || allMedia.length === 0) return allMedia;
    
    console.log('Reordering media files:', allMedia);
    
    const videos = allMedia.filter(media => media.type === 'video');
    const images = allMedia.filter(media => media.type === 'image');
    
    console.log('Videos found:', videos.length);
    console.log('Images found:', images.length);
    
    // จัดลำดับ: วิดีโอขึ้นก่อน รูปภาพตามหลัง
    const reorderedMedia: { type: string; url: string }[] = [];
    reorderedMedia.push(...videos);
    reorderedMedia.push(...images);
    
    console.log('Reordered media:', reorderedMedia);
    
    return reorderedMedia;
  }

  // เพิ่มฟังก์ชันล้างข้อมูลเก่า
  private clearStoredData(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUserId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('currentUserId');
  }

  // ฟังก์ชันบันทึกจำนวนแจ้งเตือน - ไม่ต้องทำอะไรเพราะ Event Service จัดการแล้ว
  private saveNotificationCountsToStorage(): void {
    // Event Service จัดการ localStorage ให้แล้ว ไม่ต้องทำอะไร
    console.log('Notification counts managed by Event Service');
  }

  // ฟังก์ชันโหลดจำนวนแจ้งเตือนจาก Event Service
  private loadNotificationCountsFromStorage(): void {
    // ใช้ข้อมูลจาก Event Service แทน localStorage
    this.notificationCounts = this.notificationService.currentCounts;
    console.log('Loaded notification counts from Event Service:', this.notificationCounts);
  }

  // ฟังก์ชันโหลดโพสต์จาก localStorage
  private loadPostsFromStorage(): void {
    console.log('Loading posts from storage for userId:', this.userId);
    const storedPosts = localStorage.getItem(`followingPosts_${this.userId}`);
    console.log('Stored posts found:', !!storedPosts);
    
    if (storedPosts) {
      try {
        this.posts = JSON.parse(storedPosts);
        console.log('Loaded following posts from storage:', this.posts.length);
      } catch (error) {
        console.error('Error parsing stored posts:', error);
        this.posts = [];
      }
    } else {
      console.log('No stored posts found, setting empty array');
      this.posts = [];
    }
  }

  // ฟังก์ชันโหลด view counts จาก localStorage
  private loadViewCountsFromStorage(): void {
    const storedViewCounts = localStorage.getItem(`viewCounts_${this.userId}`);
    if (storedViewCounts) {
      try {
        this.viewPosts = JSON.parse(storedViewCounts);
        console.log('Loaded view counts from storage:', this.viewPosts.length);
      } catch (error) {
        console.error('Error parsing stored view counts:', error);
        this.viewPosts = [];
      }
    } else {
      this.viewPosts = [];
    }
  }
}
