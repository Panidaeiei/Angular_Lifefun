import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ShowPost } from '../../models/showpost_model';
import { UserService } from '../../services/Userservice';
import { PostService } from '../../services/Postservice';
import { ReactPostservice } from '../../services/ReactPostservice';

@Component({
  selector: 'app-homepage-user',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule],
  templateUrl: './homepage-user.component.html',
  styleUrl: './homepage-user.component.scss',
})
export class HomepageUserComponent {
  currentUserId: string | null = null;
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด

  constructor(private route: ActivatedRoute, private userService: UserService, private postService: PostService, private likePostService: ReactPostservice, private router: Router,) { }

  ngOnInit(): void {
    // ดึงค่าจาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID:', this.userId);
      } else {
        this.userId = ''; // กำหนดค่าเริ่มต้นเมื่อไม่มี User ID
        console.warn('User ID not found in query parameters.');
      }
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
      console.log('Current User ID eiei:', this.currentUserId);
    });

    this.userService.loadCurrentUserId();

    // ดึงโพสต์จาก Backend
    this.fetchPosts();
  }

  fetchPosts(): void {
    this.postService.getPosts().subscribe(
      (response: ShowPost[]) => {
        console.log('Response from API:', response);  // ตรวจสอบข้อมูลที่ได้รับจาก API

        // กรองโพสต์ที่มี `post_id` ซ้ำ
        const uniquePosts = response.filter((value, index, self) =>
          index === self.findIndex((t) => (
            t.post_id === value.post_id
          ))
        );

        console.log('Unique Posts:', uniquePosts); // ตรวจสอบโพสต์ที่กรองออกมา

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
    const userId = this.userId;  // ใช้ userId ที่ได้จาก queryParams

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

    if (userId === this.currentUserId) {
      // นำทางไปหน้าโปรไฟล์ของตนเอง
      this.router.navigate(['/ProfileUser'], { queryParams: { id: this.userId } });
    } else {
      // นำทางไปหน้าโปรไฟล์ของคนอื่น
      this.router.navigate(['/view_user', userId]);
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
