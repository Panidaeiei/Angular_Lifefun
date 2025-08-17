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
  standalone: true,
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

  // เพิ่มข้อมูลหมวดหมู่
  categories = [
    { name: 'เครื่องสำอาง', image: 'assets/images/istockphoto.jpg', route: '/Post_Cosmetics' },
    { name: 'แฟชั่น', image: 'https://i.pinimg.com/736x/c1/51/cd/c151cdffa326596504b10c6bd98a9958.jpg', route: '/Post_Fashion' },
    { name: 'สกินแคร์', image: 'assets/images/skincare.jpg', route: '/Post_Skincare' },
    { name: 'อาหาร', image: 'assets/images/food.jpg', route: '/Post_Food' },
    { name: 'สุขภาพ', image: 'assets/images/woman.jpg', route: '/Post_Health' },
    { name: 'ท่องเที่ยว', image: 'https://i.pinimg.com/736x/3c/39/7a/3c397a110bed100bf40ccd76ad94c922.jpg', route: '/Post_Travel' }
  ];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private postService: PostService,
    private likePostService: ReactPostservice,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 1) ต้องมี token + userId ใน storage เท่านั้น
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    // 2) ตรวจสอบความถูกต้องของ token
    this.validateToken(token);

    this.checkScreenSize();

    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
      // ตรวจสอบว่า userId ใน URL ตรงกับ userId ที่ล็อกอิน
      if (this.userId !== loggedInUserId) {
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
    }

    // เรียก loadCurrentUserId เพียงครั้งเดียว
    this.userService.loadCurrentUserId();

    // เรียก getCurrentUserId เพียงครั้งเดียวและจัดการทุกอย่างในนั้น
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;

      // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
      const urlUserId = this.route.snapshot.queryParams['id'];
      if (urlUserId && userId && urlUserId !== userId) {
        // ถ้า id ใน url ไม่ตรงกับ id ที่ล็อกอินไว้ ให้ใช้ userId ที่ล็อกอินแทน
        this.userId = userId;
        return;
      }

      // โหลดข้อมูลหลังจากได้ currentUserId แล้ว
      this.loadUserData();
    });

    this.likePostService.likeStatus$.subscribe((status) => {
      // ดำเนินการที่ต้องการเมื่อไลค์เปลี่ยนแปลง
    });

    this.postService.getViewCounts().subscribe({
      next: (data) => {
        this.viewPosts = data;
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
      // โหลดโพสต์ (ไม่ต้องเรียก getCurrentUserId อีก เพราะเรียกไปแล้วใน ngOnInit)
      this.fetchPosts();
    }
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

  // เพิ่มฟังก์ชันบันทึกข้อมูลลง localStorage
  private saveNotificationCountsToStorage(): void {
    const countsToSave = {
      like: this.notificationCounts.like || 0,
      follow: this.notificationCounts.follow || 0,
      share: this.notificationCounts.share || 0,
      comment: this.notificationCounts.comment || 0,
      unban: this.notificationCounts.unban || 0,
      total: (this.notificationCounts.like || 0) + (this.notificationCounts.follow || 0) + (this.notificationCounts.share || 0) + (this.notificationCounts.comment || 0) + (this.notificationCounts.unban || 0)
    };
    
    localStorage.setItem(`notificationCounts_${this.userId}`, JSON.stringify(countsToSave));
    this.notificationCounts = countsToSave;
    console.log('Saved notification counts to storage:', countsToSave);
  }

  // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดข้อมูลจาก localStorage เท่านั้น (ไม่เรียก backend)
      this.loadNotificationCountsFromStorage();
      
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

        // กรองโพสต์ที่มี `post_id` ซ้ำ
        const uniquePosts = response.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.post_id === value.post_id
          ))
        );

        // อัปเดตค่า posts ที่กรองแล้ว
        this.posts = uniquePosts;

        // จัดการข้อมูลไฟล์หลายไฟล์ที่มาจาก Backend
        this.posts.forEach(post => {
          // ตรวจสอบและตั้งค่า currentImageIndex ถ้าไม่มี
          if (post.currentImageIndex === undefined) {
            post.currentImageIndex = 0;
          }

          // จัดลำดับไฟล์ใหม่ตาม logic ของ detail-post (วิดีโอขึ้นก่อน รูปภาพตามหลัง)
          if (post.allMedia && post.allMedia.length > 0) {
            const reorderedMedia = this.reorderMediaFiles(post.allMedia);
            post.allMedia = reorderedMedia;

            // อัปเดต media_url และ media_type จากไฟล์แรกที่จัดลำดับแล้ว
            if (post.allMedia && post.allMedia.length > 0) {
              const firstMedia = post.allMedia[0];
              post.media_url = firstMedia.url;
              post.media_type = firstMedia.type as 'image' | 'video';
            }
          }
        });

        // ตรวจสอบสถานะไลค์สำหรับแต่ละโพสต์ - รอให้ currentUserId พร้อม
        if (this.currentUserId) {
          // ลบการเรียก API checkLikeStatus ทุกโพสต์ออก
          // this.posts.forEach(post => {
          //   this.checkLikeStatusForPost(post);
          // });
        } else {
          // ตรวจสอบสถานะไลค์หลังจาก currentUserId พร้อม
          this.userService.getCurrentUserId().subscribe((userId) => {
            if (userId && this.posts.length > 0) {
              // ลบการเรียก API checkLikeStatus ทุกโพสต์ออก
              // this.posts.forEach(post => {
              //   this.checkLikeStatusForPost(post);
              // });
            }
          });
        }
      },
      (error) => {
        console.error('Error fetching posts:', error);
      }
    );
  }

  // เพิ่มฟังก์ชันตรวจสอบสถานะไลค์สำหรับแต่ละโพสต์
  private checkLikeStatusForPost(post: ShowPost): void {
    if (!this.currentUserId) {
      return;
    }

    this.likePostService.checkLikeStatus(post.post_id).subscribe({
      next: (response) => {
        // อัพเดตสถานะไลค์ในโพสต์ - ตรวจสอบทั้ง isLiked และ liked
        if (response.isLiked !== undefined) {
          post.isLiked = response.isLiked;
        } else if (response.liked !== undefined) {
          post.isLiked = response.liked;
        }
      },
      error: (error) => {
        console.error('Error checking like status for post', post.post_id, ':', error);
      }
    });
  }

  toggleHeart(post: ShowPost): void {
    if (!this.currentUserId) {
      console.error('User ID not found');
      return;
    }

    // Optimistic update - อัพเดต UI ทันที
    const currentLikedState = post.isLiked;
    post.isLiked = !currentLikedState;

    this.likePostService.likePost(post.post_id, Number(this.currentUserId)).subscribe({
      next: (response) => {

        // อัพเดตจำนวนไลค์ - ตรวจสอบทั้ง likeCount และ likes_count
        if (response.likes_count !== undefined) {
          post.likes_count = response.likes_count;
        } else if (response.likeCount !== undefined) {
          post.likes_count = response.likeCount;
        }

        // ไม่ต้องเรียก checkLikeStatus ซ้ำ เพราะ response จาก likePost มีข้อมูลครบแล้ว
        // อัปเดต localStorage โดยตรง
        if (this.userId && post.isLiked) {
          // เพิ่มจำนวนไลค์ใน localStorage
          const storedCounts = localStorage.getItem(`notificationCounts_${this.userId}`);
          if (storedCounts) {
            try {
              const counts = JSON.parse(storedCounts);
              counts.like = (counts.like || 0) + 1;
              counts.total = (counts.total || 0) + 1;
              localStorage.setItem(`notificationCounts_${this.userId}`, JSON.stringify(counts));
              this.notificationCounts = counts;
              console.log('Updated notification counts in localStorage:', counts);
            } catch (error) {
              console.error('Error updating notification counts in localStorage:', error);
            }
          }
        }


      },
      error: (error) => {
        console.error('Error toggling like:', error);
        // Rollback optimistic update ถ้า API ล้มเหลว
        post.isLiked = currentLikedState;
      }
    });
  }

  goToProfile(userId: string): void {
    if (!userId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }

    // ตรวจสอบว่าเป็นโปรไฟล์ตัวเองหรือไม่
    if (userId === this.currentUserId) {
      // ถ้าเป็นโปรไฟล์ตัวเอง ให้ไปหน้า ProfileUser
      this.router.navigate(['/ProfileUser'], {
        queryParams: { id: userId }
      });
    } else {
      // ถ้าเป็นโปรไฟล์คนอื่น ให้ไปหน้า view_user
      this.router.navigate(['/view_user', this.currentUserId], {
        queryParams: { Profileuser: userId }
      });
    }
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }



  logout() {
    this.clearStoredData();
    this.router.navigate(['/login']);
  }

  // เพิ่มฟังก์ชันสำหรับนำทางไปยังหมวดหมู่
  goToCategory(route: string) {
    this.router.navigate([route], { queryParams: { id: this.currentUserId } });
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

    const videos = allMedia.filter(media => media.type === 'video');
    const images = allMedia.filter(media => media.type === 'image');

    // จัดลำดับ: วิดีโอขึ้นก่อน รูปภาพตามหลัง
    const reorderedMedia: { type: string; url: string }[] = [];
    reorderedMedia.push(...videos);
    reorderedMedia.push(...images);

    return reorderedMedia;
  }


  ngOnDestroy(): void {
    // ไม่ต้องหยุดการติดตามการแจ้งเตือนอีกต่อไป - ใช้ localStorage เท่านั้น
    // this.notificationService.stopAutoUpdate();

    // ยกเลิก subscription (ถ้ามี)
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // ตรวจสอบความถูกต้องของ token
  private validateToken(token: string): void {
    try {
      // ตรวจสอบว่า token เป็น JWT format หรือไม่
      const parts = token.split('.');
      if (parts.length !== 3) {
        // ถ้า token format ไม่ถูกต้อง ให้ redirect ไป login
        this.router.navigate(['/login'], { queryParams: { error: 'invalid_token' } });
        return;
      }

      // ตรวจสอบ expiration time (ถ้ามี)
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > payload.exp) {
          // ถ้า token หมดอายุ ให้ redirect ไป login
          this.router.navigate(['/login'], { queryParams: { error: 'token_expired' } });
          return;
        }
      }

      // Token ผ่านการตรวจสอบแล้ว

    } catch (error) {
      // ถ้าเกิด error ในการตรวจสอบ token ให้ redirect ไป login
      this.router.navigate(['/login'], { queryParams: { error: 'token_validation_error' } });
    }
  }

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
}
