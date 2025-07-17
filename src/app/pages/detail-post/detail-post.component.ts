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
import { TimeAgoPipe, FormatLocalTimePipe} from '../../pipes/time-ago.pipe';
import { Comment } from '../../models/comment_model';
import { SharePostModel } from '../../models/sharepost_model';
import { SavePostModel } from '../../models/savepost_service';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-detail-post',
  imports: [
    MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, NewlineToBrPipe, FormsModule, TimeAgoPipe, FormatLocalTimePipe, MatTooltipModule
  ],
  templateUrl: './detail-post.component.html',
  styleUrls: ['./detail-post.component.scss']
})
export class DetailPostComponent implements OnInit {
  userId: string = '';
  commentOwnerId: string = '';
  postId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  post: DetailPost | null = null; // เก็บโพสต์เดียว
  currentMedia: { type: string; url: string } = { type: '', url: '' };
  currentMediaIndex: number = 0; // ตัวแปรนี้ใช้สำหรับการเลื่อนดูสื่อ
  controlsVisible: boolean = false;
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด
  isEditing = false;
  title: string = '';
  postcom: any; // ข้อมูลโพสต์ที่ดึงมา
  comments: any[] = []; // คอมเมนต์ที่ดึงมา
  isExpanded: boolean = false;
  shareCount: number = 0;
  isShared: boolean = false;
  isSave: boolean = false;
  currentUserId: string | null = null;
  viewerId: string = '';
  touchStartX = 0;
  touchEndX = 0;
  touchStartY = 0;
  touchEndY = 0;
  isMobile: boolean = false;

  @ViewChild('commentInput') commentInput!: ElementRef;
  @ViewChildren(MatMenuTrigger) menuTriggers!: QueryList<MatMenuTrigger>;


  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private postService: PostService, private reactPostservice: ReactPostservice, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.onResize.bind(this));
    // ดึงค่าจาก Query Parameters เพียงครั้งเดียว
    this.route.queryParams.subscribe((params) => {
      console.log('Detail-post received params:', params); // เพิ่ม debug log
      // ตรวจสอบว่า post_id และ user_id อยู่ใน query params หรือไม่
      if (params['post_id']) {
        this.postId = params['post_id'];
        console.log('Post ID:', this.postId);
        this.fetchPost(this.postId); // ดึงข้อมูลโพสต์ตาม postId
        this.loadComments(Number(this.postId));
        this.loadShareStatus();
        this.loadSaveStatus();
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

    // การ subscribe กับ likeStatus$
    this.reactPostservice.likeStatus$.subscribe((status) => {
      console.log("Like status updated:", status);
      // ดำเนินการที่ต้องการเมื่อไลค์เปลี่ยนแปลง
    });

    // ดึง currentUserId
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      console.log('Current User ID eiei:', this.currentUserId);
    });

    // ตรวจสอบสถานะไลค์ของโพสต์
    this.posts.forEach((post) => {
      this.checkLikeStatus(post.post_id);
    });

    // ดึงคอมเมนต์ (ฟังก์ชันนี้ยังคงเรียกเช่นเดิม)
    this.fetchComments();

    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      console.log('Current User ID eiei:', this.currentUserId);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 900;
  }

  onResize() {
    this.checkScreenSize();
  }

  openReportDialog(postId: number): void {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '400px',
      data: { pid: postId, uid: this.userId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        alert('ส่งรายงานสำเร็จแล้ว');
      }
    });
  }

  openReportCommentDialog(cid: number) {
    const dialogRef = this.dialog.open(ReportDialogComponent, {
      width: '400px',
      data: { cid }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('เหตุผลการรายงาน:', result);
        // 🔻 ส่งเหตุผลและ postId ไป backend ได้ที่นี่
      }
    });
  }

  goToProfile(userId: string): void {
    console.log('Current User ID:', this.currentUserId);
    console.log('Navigating to:', userId);
    console.log('Query Params ID:', this.userId);

    if (String(userId) === String(this.userId)) {
      // หาก userId คือ currentUserId, ไปที่หน้าประวัติของผู้ใช้ (ProfileUser)
      this.router.navigate(['/ProfileUser'], { queryParams: { id: userId } });
    } else {
      // หาก userId ไม่เหมือน currentUserId, ไปที่หน้าผู้ใช้ที่กำลังดู (view_user) พร้อม queryParams สำหรับ viewerId
      this.router.navigate(['/view_user', this.currentUserId], { queryParams: { Profileuser: userId } });
    }
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


  fetchPost(postId: string): void {
    const postIdNumber = Number(postId);  // แปลง postId จาก string เป็น number

    if (isNaN(postIdNumber)) {
      console.error('Invalid postId:', postId);
      return; // หยุดการทำงานถ้าไม่สามารถแปลงเป็น number ได้
    }

    this.postService.getPostById(postIdNumber).subscribe(
      (response) => {
        this.post = response;
        this.title = this.post.title;  // ตั้งค่า title ที่จะใช้ในการแก้ไข
        this.currentMediaIndex = 0;
        console.log('Fetched post details:', this.post);
        
        // ตรวจสอบว่ามีรูปหรือวิดีโอหรือไม่
        const totalMedia = (this.post.images?.length || 0) + (this.post.videos?.length || 0);
        console.log('Total media found:', totalMedia);
        
        this.updateCurrentMedia(); // เรียกอัปเดต media หลังจากโหลดโพสต์
      },
      (error) => {
        console.error('Error fetching post details:', error);
      }
    );

  }

  loadShareStatus(): void {
    const data: SharePostModel = { post_id: Number(this.postId) };

    this.reactPostservice.getShareStatus(data).subscribe(
      (response) => {
        this.isShared = response.isShared; // ตั้งค่าสถานะตามข้อมูลจาก API
      },
      (error) => {
        console.error('Error loading post status:', error);
      }
    );
  }

  loadSaveStatus(): void {
    this.reactPostservice.getSaveStatus(Number(this.postId)).subscribe(
      (response) => {
        this.isSave = response.isSave;
        console.log('Save status loaded:', this.isSave);
      },
      (error) => {
        console.error('Error loading save status:', error);
      }
    );
  }


  loadComments(postId: number): void {
    this.reactPostservice.getComments(postId).subscribe({
      next: (data) => {
        console.log('Response from API:', data); // Log ข้อมูลที่ได้รับ
        this.comments = data.comments || []; // ใช้ค่าเริ่มต้นถ้าไม่มี comments
      },
      error: (err) => {
        console.error('Error fetching comments:', err); // Log ข้อผิดพลาด
      }
    });
  }

  encodeLocation(location: string): string {
    return encodeURIComponent(location);
  }
  updateCurrentMedia(): void {
    if (this.post) {
      const allMedia = [
        ...this.post?.images.map((url) => ({ type: 'image', url })),
        ...this.post?.videos.map((url) => ({ type: 'video', url }))
      ];
      
      // ตรวจสอบว่า currentMediaIndex อยู่ในช่วงที่ถูกต้อง
      if (this.currentMediaIndex >= 0 && this.currentMediaIndex < allMedia.length) {
      this.currentMedia = allMedia[this.currentMediaIndex];
        console.log('Updated current media:', this.currentMedia);
      } else {
        console.error('Invalid media index:', this.currentMediaIndex, 'Total media:', allMedia.length);
        // รีเซ็ตเป็นรูปแรกถ้าดัชนีไม่ถูกต้อง
        if (allMedia.length > 0) {
          this.currentMediaIndex = 0;
          this.currentMedia = allMedia[0];
        }
      }
    }
  }

  nextMedia(): void {
    if (this.post && (this.post.images.length + this.post.videos.length) > 1) {  // ตรวจสอบ post ว่ามีข้อมูลและมีหลาย media
      const totalMedia = this.post.images.length + this.post.videos.length;
      this.currentMediaIndex = (this.currentMediaIndex + 1) % totalMedia;
      this.updateCurrentMedia();
      console.log('Next media - Index:', this.currentMediaIndex, 'Total:', totalMedia);
    }
  }

  prevMedia(): void {
    if (this.post && (this.post.images.length + this.post.videos.length) > 1) {  // ตรวจสอบ post ว่ามีข้อมูลและมีหลาย media
      const totalMedia = this.post.images.length + this.post.videos.length;
      this.currentMediaIndex = (this.currentMediaIndex - 1 + totalMedia) % totalMedia;
      this.updateCurrentMedia();
      console.log('Previous media - Index:', this.currentMediaIndex, 'Total:', totalMedia);
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
    this.reactPostservice.likePost(post.post_id, Number(userId)).subscribe(
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
    this.reactPostservice.checkLikeStatus(postId).subscribe(
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
  
  deletePost(postId: number): void {
    // เปิด dialog เพื่อยืนยันการลบโพสต์ โดยไม่มีการเคลื่อนไหว
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      enterAnimationDuration: '0ms',  // ปิดการเคลื่อนไหวในการเปิด
      exitAnimationDuration: '0ms'   // ปิดการเคลื่อนไหวในการปิด
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {  // ถ้าผู้ใช้ยืนยัน
        this.postService.deletePost(postId).subscribe(
          (response) => {
            alert('โพสต์ถูกลบเรียบร้อย');
            this.router.navigate(['/HomepageUser'], { queryParams: { id: this.userId } });
          },
          (error) => {
            alert('เกิดข้อผิดพลาดในการลบโพสต์');
            console.error(error);
          }
        );
      }
    });
  }

  editPost(): void {
    this.isEditing = true;  // เปิดโหมดแก้ไข
  }


  cancelEdit(): void {
    this.isEditing = false;  // ปิดโหมดแก้ไข
    this.title = this.post?.title || '';  // รีเซ็ต title กลับเป็นค่าเดิม
  }

  saveEditedPost(): void {
    // แปลง postId เป็น number ก่อนส่ง
    const postIdAsNumber = +this.postId;

    const editData: EditPostModel = {
      title: this.title,  // ส่งเฉพาะ title ที่แก้ไข
    };

    this.postService.editPost(postIdAsNumber, editData).subscribe(
      (response) => {
        if (this.post) {
          // สามารถเข้าถึง this.post ได้ที่นี่
          this.post.title = this.title;
        } else {
          console.error('Post is null');
        }
        this.isEditing = false;
      },
      (error) => {
        alert('เกิดข้อผิดพลาดในการแก้ไขโพสต์');
        console.error('Error editing post:', error);
      }
    );
  }

  sortCommentsByDate(): void {
    if (this.comments && this.comments.length > 1) {
      this.comments.sort(
        (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
      );
    }
  }

  onSubmitComment(commentTitle: string): void {
    if (commentTitle.trim()) {
      const userId = localStorage.getItem('userId'); // ดึง userId จาก localStorage หรือ JWT token

      if (!userId) {
        alert('ไม่พบข้อมูลผู้ใช้');
        return; // ถ้าไม่พบ userId ให้หยุดทำงาน
      }

      this.reactPostservice.addComment(Number(this.postId), commentTitle, Number(userId)).subscribe(
        (response) => {
          console.log('Comment added successfully:', response);

          this.fetchComments(); // รีเฟรชความคิดเห็นใหม่
          this.commentInput.nativeElement.value = '';

        },
        (error) => {
          console.error('Error adding comment:', error);
        }
      );
    } else {
      alert('กรุณากรอกความคิดเห็น');
    }
  }

  deleteComment(commentId: string): void {
    // แสดงกล่องยืนยันการลบ
    const confirmDelete = window.confirm('คุณแน่ใจหรือไม่ว่าจะลบคอมเมนต์นี้?');

    if (confirmDelete) {
      // ถ้าผู้ใช้กด "ตกลง"
      this.reactPostservice.deleteComment(commentId).subscribe(
        (response) => {
          console.log('คอมเมนต์ถูกลบเรียบร้อย');
          this.sortCommentsByDate();
          this.fetchComments();  // ดึงข้อมูลคอมเมนต์ใหม่

        },
        (error) => {
          console.error('ไม่สามารถลบคอมเมนต์ได้:', error);
        }
      );
    } else {
      console.log('การลบคอมเมนต์ถูกยกเลิก');
    }
  }

  showAllComments: boolean = false; // กำหนดค่าเริ่มต้นให้แสดงคอมเมนต์แค่ 4 อันแรก

  toggleShowComments(): void {
    this.showAllComments = !this.showAllComments;
  }

  toggleSavePost(): void {
    const data: SavePostModel = { post_id: Number(this.postId) }; // ตรวจสอบ postId เป็นตัวเลข

    this.reactPostservice.saveOrUnsavePost(data).subscribe(
      (response) => {
        this.isSave = response.isSave;

      },
      (error) => {
        console.error('Error saving/unsaving post:', error);
        alert('เกิดข้อผิดพลาดในการดำเนินการ');
      }
    );
  }



  sharePost(): void {
    // กำหนดข้อความยืนยันตามสถานะการแชร์
    const confirmMessage = this.isShared
      ? 'คุณต้องการยกเลิกการแชร์โพสต์นี้หรือไม่?'
      : 'คุณต้องการแชร์โพสต์นี้หรือไม่?';

    // แสดงกล่องยืนยัน
    const userConfirmed = window.confirm(confirmMessage);

    if (userConfirmed) {
      const data: SharePostModel = {
        post_id: Number(this.postId),
      };

      // เรียกใช้บริการแชร์หรือยกเลิกการแชร์
      this.reactPostservice.sharePost(data).subscribe(
        (response) => {
          if (response.message === 'Post shared successfully.') {
            console.log('Post shared successfully:', response);
            this.isShared = true; // ตั้งค่าสถานะว่าแชร์แล้ว
          } else if (response.message === 'Post unshared successfully.') {
            console.log('Post unshared successfully:', response);
            this.isShared = false;
          }
        },
        (error) => {
          console.error('Error sharing/unsharing post:', error);
          alert('เกิดข้อผิดพลาดในการดำเนินการ');
        }
      );
    } else {
      // ผู้ใช้กดยกเลิกการยืนยัน
      console.log('การดำเนินการถูกยกเลิกโดยผู้ใช้');
    }
  }

  onTouchStart(event: TouchEvent) {
    // ตรวจสอบว่ามีรูปหรือวิดีโอหลายรูปหรือไม่
    if (!this.post || (this.post.images.length + this.post.videos.length) <= 1) {
      return;
    }
    
    // ป้องกันการเลื่อนหน้าจอเมื่อเริ่มแตะ
    event.preventDefault();
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
    console.log('Touch start:', this.touchStartX, this.touchStartY);
  }
  
  onTouchMove(event: TouchEvent) {
    // ตรวจสอบว่ามีรูปหรือวิดีโอหลายรูปหรือไม่
    if (!this.post || (this.post.images.length + this.post.videos.length) <= 1) {
      return;
    }
    
    // ป้องกันการเลื่อนหน้าจอเมื่อเลื่อนนิ้ว
    event.preventDefault();
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
  }
  
  onTouchEnd(event: TouchEvent) {
    // ตรวจสอบว่ามีรูปหรือวิดีโอหลายรูปหรือไม่
    if (!this.post || (this.post.images.length + this.post.videos.length) <= 1) {
      return;
    }
    
    // คำนวณระยะทางที่เลื่อน
    const deltaX = this.touchStartX - this.touchEndX;
    const deltaY = this.touchStartY - this.touchEndY;
    
    console.log('Touch end - Delta X:', deltaX, 'Delta Y:', deltaY);
    
    // ตรวจสอบว่าเป็นการเลื่อนแนวนอนหรือแนวตั้ง
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    // ถ้าเป็นการเลื่อนแนวนอนและมีระยะทางมากกว่า 50px
    if (isHorizontalSwipe && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // เลื่อนไปทางขวา (รูปถัดไป)
        console.log('Swiping right - Next media');
        this.nextMedia();
      } else {
        // เลื่อนไปทางซ้าย (รูปก่อนหน้า)
        console.log('Swiping left - Previous media');
        this.prevMedia();
      }
    }
    
    // รีเซ็ตค่า
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.touchStartY = 0;
    this.touchEndY = 0;
  }

}