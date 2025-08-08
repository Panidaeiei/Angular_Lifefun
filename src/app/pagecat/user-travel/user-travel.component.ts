import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ShowPost } from '../../models/showpost_model';
import { UserService } from '../../services/Userservice';
import { PostService } from '../../services/Postservice';
import { ReactPostservice } from '../../services/ReactPostservice';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-user-travel',
  standalone: true,
  imports: [
    MatToolbarModule,
    RouterModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './user-travel.component.html',
  styleUrl: './user-travel.component.scss'
})
export class UserTravelComponent {
  constructor(private route: ActivatedRoute, private userService: UserService, private postService: PostService, private likePostService: ReactPostservice, private router: Router) { }
  
  currentUserId: string | null = null;
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false;
  posts: ShowPost[] = [];
  message: string = '';
  postId: string = '';
  isMobile: boolean = false;
  viewPosts: any[] = [];

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
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
    //ดึงค่าจาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      this.postId = params['post_id'] || ''; // ดึง post_id
      console.log('User ID:', this.userId);

      if (this.postId) {
        this.viewPost(this.postId); // ✅ อัพเดตจำนวนการดูโพสต์
      } else {

      }
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
  }

  loadPosts(): void {
    this.postService.getPostsTravel().subscribe(
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

  logout(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}
