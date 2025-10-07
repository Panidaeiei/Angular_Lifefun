import { ShowPost } from '../../models/showpost_model';
import { PostService } from '../../services/Postservice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactPostservice } from '../../services/ReactPostservice';
import { UserService } from '../../services/Userservice';
import { Component } from '@angular/core';
import { HostListener } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-s-test',
  standalone: true,
  imports: [
    MatToolbarModule, 
    CommonModule, 
    MatTabsModule, 
    MatCardModule, 
    MatButtonModule, 
    FormsModule, 
    RouterModule, 
    TimeAgoPipe, 
    MatTooltipModule
  ],
  templateUrl: './s-test.component.html',
  styleUrl: './s-test.component.scss'
})

export class STestComponent {

  userId: string = '';
  currentUserId: string | null = null;
  searchQuery = '';
  posts: any[] = [];
  loading = false;
  errorMessage = '';
  isDrawerOpen: boolean = false;
  showFull: { [key: string]: boolean } = {};
  activeTab: string = 'post';
  isMobile: boolean = false;
  notificationCounts: { [key: string]: number } = {};
  private notificationSubscription: Subscription | null = null;
  
  // เพิ่ม cache และ optimization
  private likeStatusCache: { [postId: number]: boolean } = {};
  private searchSubject = new Subject<string>();
  public postsLoaded = false;  // เปลี่ยนเป็น public เพื่อใช้ใน template

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private likePostService: ReactPostservice,
    private userService: UserService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    // ตรวจสอบ UID แค่ครั้งเดียว
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

    // โหลดข้อมูลผู้ใช้ปัจจุบัน
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
    });

    this.userService.loadCurrentUserId();

    // ตรวจสอบขนาดหน้าจอ
    this.checkScreenSize();

    // เริ่มการติดตามการแจ้งเตือน
    this.startNotificationTracking();

    // ตั้งค่า debounced search
    this.setupDebouncedSearch();

    // ไม่โหลดโพสต์ทันที - รอให้ user scroll หรือกดปุ่ม
    // this.loadInitialPosts(); // ลบออก
  }

  // เพิ่มฟังก์ชันตั้งค่า debounced search
  private setupDebouncedSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300), // รอ 300ms หลังหยุดพิมพ์
      distinctUntilChanged() // เรียกเฉพาะเมื่อ query เปลี่ยน
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  // แยกฟังก์ชันการค้นหาจริง
  private performSearch(query: string): void {
    if (query.trim() === '') {
      this.posts = [];
      return;
    }

    this.loading = true;
    this.postService.searchPosts(query).subscribe({
      next: (data) => {
        // กรองโพสต์ที่ post_id ซ้ำ
        const uniquePosts = data.filter((value, index, self) =>
          index === self.findIndex((t) => t.post_id === value.post_id)
        );
        this.posts = uniquePosts;
        
        // กำหนดค่าเริ่มต้นสำหรับ isLiked ถ้าไม่มี
        this.posts.forEach((post) => {
          if (post.isLiked === undefined) {
            (post as any).isLiked = false;
          }
          // แสดงเฉพาะไฟล์แรก
          this.initializePostMedia(post);
        });
        
        // ใช้ cache แทนการเรียก API ทุกครั้ง
        this.updateLikeStatusFromCache();
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  // เพิ่มฟังก์ชันโหลดโพสต์แบบ lazy
  loadPostsLazy(): void {
    if (this.postsLoaded) return;
    
    this.loading = true;
    // ลบการดึงโพสต์ทั้งหมดออก - ไม่จำเป็นแล้ว
    // this.postService.getPosts().subscribe((data: any[]) => {
    //   // กรองโพสต์ที่ post_id ซ้ำ
    //   const uniquePosts = data.filter((value, index, self) =>
    //     index === self.findIndex((t) => t.post_id === value.post_id)
    //   );
    //   this.allPosts = uniquePosts;
      
    //   // แสดงเฉพาะโพสต์แรกๆ (pagination)
    //   this.posts = uniquePosts.slice(0, this.postsPerPage);
      
    //   // กำหนดค่าเริ่มต้นสำหรับ isLiked ถ้าไม่มี
    //   this.posts.forEach((post) => {
    //     if (post.isLiked === undefined) {
    //       (post as any).isLiked = false;
    //     }
    //     // แสดงเฉพาะไฟล์แรก
    //     this.initializePostMedia(post);
    //   });

    //   // ใช้ cache แทนการเรียก API ทุกครั้ง
    //   this.updateLikeStatusFromCache();
      
    //   this.postsLoaded = true;
    //   this.loading = false;
    // });
    
    // แทนที่ด้วยการตั้งค่าสถานะ
    this.postsLoaded = true;
    this.loading = false;
    this.posts = []; // ไม่มีโพสต์แสดงจนกว่าจะค้นหา
  }

  // ลบฟังก์ชัน loadMorePosts ออก - ไม่ใช้แล้ว
  // loadMorePosts(): void { ... }

  // เพิ่มฟังก์ชันอัปเดต like status จาก cache
  private updateLikeStatusFromCache(): void {
    this.posts.forEach((post) => {
      if (this.likeStatusCache.hasOwnProperty(post.post_id)) {
        post.isLiked = this.likeStatusCache[post.post_id];
      }
    });
  }

  // แยกฟังก์ชันโหลดโพสต์เริ่มต้น (ลบออก)
  // private loadInitialPosts(): void { ... }

  // แสดงเฉพาะไฟล์แรก
  private initializePostMedia(post: any): void {
    if (post.allMedia && post.allMedia.length > 0) {
      // จัดลำดับ media (วิดีโอขึ้นก่อน รูปภาพตามหลัง)
      const reorderedMedia = this.reorderMediaFiles(post.allMedia);
      
      // แสดงเฉพาะไฟล์แรก
      post.currentImageIndex = 0;
      post.media_url = reorderedMedia[0].url;
      post.media_type = reorderedMedia[0].type;
      
      // เก็บข้อมูล media ทั้งหมดไว้สำหรับการแสดงไอคอน
      post.allMedia = reorderedMedia;
    }
  }

  onSearch() {
    // ค้นหาทันทีเมื่อกดปุ่มค้นหาหรือกด Enter
    this.searchSubject.next(this.searchQuery);
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  toggleShowFull(postId: string) {
    this.showFull[postId] = !this.showFull[postId];
  }

  // เพิ่มฟังก์ชันติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดข้อมูลจาก localStorage เท่านั้น (ไม่เรียก backend)
      this.loadNotificationCountsFromStorage();
      
      // ไม่เรียก API อีกต่อไป - ใช้ข้อมูลจาก localStorage เท่านั้น
      // this.notificationService.loadNotificationCounts(Number(this.userId));
      
      // ไม่ต้อง subscribe อีกต่อไป - ใช้ข้อมูลจาก localStorage เท่านั้น
      // this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
      //   (counts: any) => { 
      //     this.notificationCounts = counts;
      //     // บันทึกลง localStorage ทุกครั้งที่ได้ข้อมูลใหม่
      //     this.saveNotificationCountsToStorage();
      //   }
      // );
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
      like: this.notificationCounts['like'] || 0,
      follow: this.notificationCounts['follow'] || 0,
      share: this.notificationCounts['share'] || 0,
      comment: this.notificationCounts['comment'] || 0,
      unban: this.notificationCounts['unban'] || 0,
      total: (this.notificationCounts['like'] || 0) + (this.notificationCounts['follow'] || 0) + (this.notificationCounts['share'] || 0) + (this.notificationCounts['comment'] || 0) + (this.notificationCounts['unban'] || 0)
    };
    
    localStorage.setItem(`notificationCounts_${this.userId}`, JSON.stringify(countsToSave));
    this.notificationCounts = countsToSave;
    console.log('Saved notification counts to storage:', countsToSave);
  }

  // เพิ่มฟังก์ชันตรวจสอบขนาดหน้าจอ
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  // เพิ่มฟังก์ชันการกดใจ
  toggleHeart(post: ShowPost, event?: MouseEvent): void {

    event?.stopPropagation();
    // ตรวจสอบ UID ก่อนดำเนินการ
    if (!this.validateCurrentUser()) return;

    this.likePostService.likePost(post.post_id, Number(this.currentUserId)).subscribe({
      next: (response) => {

        // ตรวจสอบว่า response มี isLiked หรือไม่
        if (response.hasOwnProperty('isLiked')) {
          post.isLiked = response.isLiked;
        } else {
          // ถ้าไม่มี isLiked ใน response ให้สลับสถานะปัจจุบัน
          post.isLiked = !post.isLiked;
        }

        // อัพเดตจำนวนไลค์
        if (response.hasOwnProperty('likeCount')) {
          post.likes_count = response.likeCount;
        } else if (response.hasOwnProperty('likes_count')) {
          post.likes_count = response.likes_count;
        }

        // บันทึกลง cache
        this.likeStatusCache[post.post_id] = post.isLiked ?? false;

      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  // เพิ่มฟังก์ชันตรวจสอบ UID
  private validateCurrentUser(): boolean {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    
    if (!loggedInUserId || !this.currentUserId || loggedInUserId !== this.currentUserId) {
      console.warn('UID validation failed, redirecting to login');
      this.clearStoredData();
      this.router.navigate(['/login'], { queryParams: { error: 'uid_validation_failed' } });
      return false;
    }
    
    return true;
  }

  // ปรับปรุงฟังก์ชันตรวจสอบสถานะการกดใจ - ใช้ cache
  checkLikeStatus(postId: number): void {
    // ตรวจสอบ cache ก่อน
    if (this.likeStatusCache.hasOwnProperty(postId)) {
      const post = this.posts.find(p => p.post_id === postId);
      if (post) {
        post.isLiked = this.likeStatusCache[postId];
      }
      return;
    }

    // เรียก API เฉพาะเมื่อไม่มีใน cache
    this.likePostService.checkLikeStatus(postId).subscribe({
      next: (response) => {

        // อัพเดตสถานะการกดใจในโพสต์
        const post = this.posts.find(p => p.post_id === postId);
        if (post) {
          // ตรวจสอบหลายรูปแบบของ response
          let isLiked = false;
          if (response.hasOwnProperty('isLiked')) {
            isLiked = response.isLiked;
          } else if (response.hasOwnProperty('liked')) {
            isLiked = response.liked;
          } else if (response.hasOwnProperty('is_liked')) {
            isLiked = response.is_liked;
          }
          
          post.isLiked = isLiked;
          // บันทึกลง cache
          this.likeStatusCache[postId] = isLiked;
        }
      },
      error: (error) => {
        console.error('Error checking like status:', error);
      }
    });
  }

  logout(): void {
    this.clearStoredData();
    this.router.navigate(['/login']);
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
    if (!post.allMedia || post.allMedia.length === 0) return;
    
    const currentIndex = post.currentImageIndex || 0;
    if (currentIndex === 0) {
      post.currentImageIndex = post.allMedia.length - 1;
    } else {
      post.currentImageIndex = currentIndex - 1;
    }
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

  // ฟังก์ชันการเลื่อนด้วยเมาส์
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
