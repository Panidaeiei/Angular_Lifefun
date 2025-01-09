import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { PostService } from '../../services/Postservice';
import { UserService } from '../../services/Userservice';
import { DetailPost } from '../../models/detail_post';
import { LikePostService } from '../../services/ReactPostservice';
import { ShowPost } from '../../models/showpost_model';
import { NewlineToBrPipe } from '../../newline-to-br.pipe';

@Component({
  selector: 'app-detail-post',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule,NewlineToBrPipe],
  templateUrl: './detail-post.component.html',
  styleUrls: ['./detail-post.component.scss']
})
export class DetailPostComponent implements OnInit {
  userId: string = '';
  postId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  post: DetailPost | null = null; // เก็บโพสต์เดียว
  currentMedia: { type: string; url: string } = { type: '', url: '' };
  currentMediaIndex: number = 0; // ตัวแปรนี้ใช้สำหรับการเลื่อนดูสื่อ
  controlsVisible: boolean = false;
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด


  constructor(private route: ActivatedRoute, private userService: UserService, private postService: PostService, private likePostService: LikePostService) { }

  ngOnInit(): void {
    // ดึงค่าจาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      if (params['post_id']) {
        this.postId = params['post_id'];
        console.log('Post ID:', this.postId);
        this.fetchPost(this.postId); // Fetch the post based on postId
      } else {
        console.error('Post ID not found in query parameters.');
      }
      if (params['user_id']) {
        this.userId = params['user_id'];
        console.log('User ID:', this.userId);
      } else {
        console.error('User ID not found in query parameters.');
      }
    });


    this.likePostService.likeStatus$.subscribe((status) => {
      console.log("Like status updated:", status);
      // ดำเนินการที่ต้องการเมื่อไลค์เปลี่ยนแปลง
    });

    this.posts.forEach((post) => {
      this.checkLikeStatus(post.post_id);
    });

    this.fetchPost(this.postId); // ดึงโพสต์
  }


  fetchPost(postId: string): void {
    this.postService.getPostById(Number(postId)).subscribe(
      (response) => {
        this.post = response;
        this.currentMediaIndex = 0;
        console.log('Fetched post details:', this.post);
        this.updateCurrentMedia(); // เรียกอัปเดต media หลังจากโหลดโพสต์
      },
      (error) => {
        console.error('Error fetching post details:', error);
      }
    );
  }


  updateCurrentMedia(): void {
    if (this.post) {
      const allMedia = [
        ...this.post?.images.map((url) => ({ type: 'image', url })),
        ...this.post?.videos.map((url) => ({ type: 'video', url }))
      ];
      this.currentMedia = allMedia[this.currentMediaIndex];
    }
  }

  nextMedia(): void {
    if (this.post && (this.post.images.length + this.post.videos.length) > 1) {  // ตรวจสอบ post ว่ามีข้อมูลและมีหลาย media
      this.currentMediaIndex = (this.currentMediaIndex + 1) % (this.post.images.length + this.post.videos.length);
      this.updateCurrentMedia();
    }
  }

  prevMedia(): void {
    if (this.post && (this.post.images.length + this.post.videos.length) > 1) {  // ตรวจสอบ post ว่ามีข้อมูลและมีหลาย media
      this.currentMediaIndex = (this.currentMediaIndex - 1 + (this.post.images.length + this.post.videos.length)) % (this.post.images.length + this.post.videos.length);
      this.updateCurrentMedia();
    }
  }


  showControls(): void {
    this.controlsVisible = true;
  }

  hideControls(): void {
    this.controlsVisible = false;
  }
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
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

  // ฟังก์ชันตรวจสอบว่าโพสต์มีหลายภาพหรือวิดีโอหรือไม่
  hasMultipleMedia(): boolean {
    const totalMediaCount = (this.post?.images?.length || 0) + (this.post?.videos?.length || 0);
    return totalMediaCount > 1; // ถ้ามีมากกว่า 1 ให้แสดงปุ่มเลื่อน
  }

  
}