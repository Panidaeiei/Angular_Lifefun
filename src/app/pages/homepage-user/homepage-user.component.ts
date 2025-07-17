import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShowPost } from '../../models/showpost_model';
import { UserService } from '../../services/Userservice';
import { PostService } from '../../services/Postservice';
import { ReactPostservice } from '../../services/ReactPostservice';
import { filter } from 'rxjs/operators';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-homepage-user',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatTooltipModule, TimeAgoPipe],
  templateUrl: './homepage-user.component.html',
  styleUrl: './homepage-user.component.scss',
})
export class HomepageUserComponent {
  currentUserId: string | null = null;
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด
  message: string = '';
  postId: string = '';
  viewPosts: any[] = [];
  isMobile: boolean = false; // เพิ่มตัวแปรสำหรับตรวจสอบ mobile

  constructor(private route: ActivatedRoute, private userService: UserService, private postService: PostService, private likePostService: ReactPostservice, private router: Router,) { }

  ngOnInit(): void {
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
  

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
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
}
