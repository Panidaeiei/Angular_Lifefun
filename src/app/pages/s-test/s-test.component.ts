import { Component, HostListener } from '@angular/core';
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
import { TimeAgoPipe} from '../../pipes/time-ago.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactPostservice } from '../../services/ReactPostservice';
import { UserService } from '../../services/Userservice';

@Component({
  selector: 'app-s-test',
  imports: [MatToolbarModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule, RouterModule, TimeAgoPipe, MatTooltipModule],
  templateUrl: './s-test.component.html',
  styleUrl: './s-test.component.scss'
})
export class STestComponent {

  userId: string = '';
  currentUserId: string | null = null;
  searchQuery = '';
  allPosts: any[] = [];
  posts: any[] = [];
  loading = false;
  errorMessage = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  showFull: { [key: string]: boolean } = {};
  activeTab: string = 'post';
  isMobile: boolean = false; 

  constructor(
    private postService: PostService, 
    private route: ActivatedRoute, 
    private router: Router,
    private likePostService: ReactPostservice,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID set from queryParams:', this.userId);
      } else {
        console.error('User ID not found in queryParams.');
      }
    });

    // โหลดข้อมูลผู้ใช้ปัจจุบัน
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      console.log('Current User ID:', this.currentUserId);
    });
    
    this.userService.loadCurrentUserId();
    
    // ตรวจสอบขนาดหน้าจอ
    this.checkScreenSize();

    this.postService.getPosts().subscribe((data: any[]) => {
      // กรองโพสต์ที่ post_id ซ้ำ
      const uniquePosts = data.filter((value, index, self) =>
        index === self.findIndex((t) => t.post_id === value.post_id)
      );
      this.allPosts = uniquePosts;
      this.posts = uniquePosts;
      
      // กำหนดค่าเริ่มต้นสำหรับ isLiked ถ้าไม่มี
      this.posts.forEach((post) => {
        if (post.isLiked === undefined) {
          post.isLiked = false;
        }
      });
      
      // ตรวจสอบสถานะการกดใจสำหรับแต่ละโพสต์
      this.posts.forEach((post) => {
        this.checkLikeStatus(post.post_id);
      });
    });
  }

  onSearch() {
    if (this.searchQuery.trim() === '') {
      this.posts = [];
      return;
    }

    this.loading = true;
    this.postService.searchPosts(this.searchQuery).subscribe({
      next: (data) => {
        // กรองโพสต์ที่ post_id ซ้ำ
        const uniquePosts = data.filter((value, index, self) =>
          index === self.findIndex((t) => t.post_id === value.post_id)
        );
        this.posts = uniquePosts;
        
        // กำหนดค่าเริ่มต้นสำหรับ isLiked ถ้าไม่มี
        this.posts.forEach((post) => {
          if (post.isLiked === undefined) {
            post.isLiked = false;
          }
        });
        
        // ตรวจสอบสถานะการกดใจสำหรับโพสต์ที่ค้นหา
        this.posts.forEach((post) => {
          this.checkLikeStatus(post.post_id);
        });
        
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  toggleShowFull(postId: string) {
    this.showFull[postId] = !this.showFull[postId];
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
  toggleHeart(post: ShowPost): void {
    if (!this.currentUserId) {
      console.error('User ID not found');
      return;
    }

    console.log('Toggling heart for post:', post.post_id, 'User ID:', this.currentUserId);
    console.log('Current like status:', post.isLiked);

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

      },
      error: (error) => {
        console.error('Error toggling like:', error);
      }
    });
  }

  // เพิ่มฟังก์ชันตรวจสอบสถานะการกดใจ
  checkLikeStatus(postId: number): void {
    this.likePostService.checkLikeStatus(postId).subscribe({
      next: (response) => {
        
        // อัพเดตสถานะการกดใจในโพสต์
        const post = this.posts.find(p => p.post_id === postId);
        if (post) {
          // ตรวจสอบหลายรูปแบบของ response
          if (response.hasOwnProperty('isLiked')) {
            post.isLiked = response.isLiked;

          } else if (response.hasOwnProperty('liked')) {
            post.isLiked = response.liked;

          } else if (response.hasOwnProperty('is_liked')) {
            post.isLiked = response.is_liked;

          } else {
            console.log('No like status found in response for post:', postId);
          }
        }
      },
      error: (error) => {
        console.error('Error checking like status:', error);
      }
    });
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
}
