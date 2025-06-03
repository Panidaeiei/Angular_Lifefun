import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { PostService } from '../../services/Postservice';
import { UserService } from '../../services/Userservice';
import { DetailPost } from '../../models/detail_post';
import { ReactPostservice } from '../../services/ReactPostservice';
import { ShowPost } from '../../models/showpost_model';
import { NewlineToBrPipe } from '../../newline-to-br.pipe';
import { ConfirmDeleteDialogComponent } from '../../confirm-delete-dialog/confirm-delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditPostModel } from '../../models/edit-post.model';
import { FormsModule } from '@angular/forms'
import { TimeAgoPipe, NewlinePipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-detail-postmain',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, NewlineToBrPipe, FormsModule, TimeAgoPipe],
  templateUrl: './detail-postmain.component.html',
  styleUrl: './detail-postmain.component.scss'
})
export class DetailPostmainComponent {
  post: any;
  currentMedia: { type: string; url: string } = { type: '', url: '' };
  currentMediaIndex: number = 0; // ตัวแปรนี้ใช้สำหรับการเลื่อนดูสื่อ
  postId: string = '';
  comments: any[] = []; // คอมเมนต์ที่ดึงมา

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private reactPostservice: ReactPostservice
  ) { }

  ngOnInit(): void {
    // ดึงค่าจาก Query Parameters เพียงครั้งเดียว
    this.route.queryParams.subscribe((params) => {
      // ตรวจสอบว่า post_id และ user_id อยู่ใน query params หรือไม่
      if (params['post_id']) {
        this.postId = params['post_id'];
        console.log('Post ID:', this.postId);
        this.fetchPost(this.postId); // ดึงข้อมูลโพสต์ตาม postId
        
      } else {
        console.error('Post ID not found in query parameters.');
      }
    });

    this.fetchComments();
  }

  
  fetchPost(postId: string): void {
    const postIdNumber = Number(postId);  // แปลง postId จาก string เป็น number

    if (isNaN(postIdNumber)) {
      console.error('Invalid postId:', postId);
      return; // หยุดการทำงานถ้าไม่สามารถแปลงเป็น number ได้
    }

    this.postService.getPostMain(postId).subscribe(
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

    fetchComments(): void {
    const postId = Number(this.postId);

    if (isNaN(postId)) {
      console.error('Invalid postId for comments:', this.postId);
      return;
    }

    this.reactPostservice.getComments(postId).subscribe(
      (response) => {
        this.comments = response.comments || [];
        console.log('Comments fetched:', this.comments);
      },
      (error) => {
        console.error('Error fetching comments:', error);
      }
    );
  }

   showAllComments: boolean = false; // กำหนดค่าเริ่มต้นให้แสดงคอมเมนต์แค่ 4 อันแรก

  toggleShowComments(): void {
    this.showAllComments = !this.showAllComments;
  }

  updateCurrentMedia(): void {
    if (this.post) {
      const allMedia = [
        ...this.post.images.map((url: string) => ({ type: 'image', url })),
        ...this.post.videos.map((url: string) => ({ type: 'video', url }))
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
}
