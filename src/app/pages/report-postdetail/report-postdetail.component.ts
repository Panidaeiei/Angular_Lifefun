import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostService } from '../../services/Postservice';
import { ReactPostservice } from '../../services/ReactPostservice';
import { NewlineToBrPipe } from '../../newline-to-br.pipe';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { AdminService } from '../../services/Admin';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../models/register_model';
import { UserService } from '../../services/Userservice';
import { ConfirmDeleteDialogComponent } from '../../confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-report-postdetail',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, MatTooltipModule, NewlineToBrPipe, FormsModule, TimeAgoPipe],
  templateUrl: './report-postdetail.component.html',
  styleUrl: './report-postdetail.component.scss'
})
export class ReportPostdetailComponent {

  userId: string = '';
  adminId: string = '';
  postId: string = '';
  isDrawerOpen: boolean = false;
  post: any;
  currentMedia: { type: string; url: string } = { type: '', url: '' };
  currentMediaIndex: number = 0; // ตัวแปรนี้ใช้สำหรับการเลื่อนดูสื่อ
  comments: any[] = []; // คอมเมนต์ที่ดึงมา
  reportNotifications: any[] = [];
  users: User[] = [];
  filteredUsers: any[] = [];
  errorMessage: string = '';
  isDeletingPost: boolean = false; // เพิ่มตัวแปรสำหรับจัดการสถานะการลบโพสต์

  constructor(private router: Router, private route: ActivatedRoute, private postService: PostService, private reactPostservice: ReactPostservice, private adminservice: AdminService, private userService: UserService, public dialog: MatDialog) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.postId = params['post_id'];     // รับ post_id จาก query
      this.userId = params['user_id'];
      this.adminId = params['adminId'];

      // ถ้าไม่มี adminId ใน query params ให้ดึงจาก storage
      if (!this.adminId) {
        const adminIdFromStorage = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');
        this.adminId = adminIdFromStorage || '';
        console.log('AdminId from storage:', this.adminId);
      }

      this.fetchPost(this.postId);
      console.log('Post ID:', this.postId);
      console.log('Admin ID:', this.adminId);
    });

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data.filter(user => user.status !== 0);
        this.filteredUsers = this.users;
      },
      error: (error) => this.errorMessage = error.message
    });

    this.fetchComments();
    console.log('โพสต์ที่โหลด:', this.post);

  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
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

  deletePost(postId: number): void {
    // ป้องกันการกดซ้ำถ้ากำลังลบอยู่
    if (this.isDeletingPost) {
      return;
    }

    // เปิด dialog เพื่อยืนยันการลบโพสต์ โดยไม่มีการเคลื่อนไหว
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      enterAnimationDuration: '0ms',  // ปิดการเคลื่อนไหวในการเปิด
      exitAnimationDuration: '0ms'   // ปิดการเคลื่อนไหวในการปิด
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {  // ถ้าผู้ใช้ยืนยัน
        this.isDeletingPost = true; // เริ่มการลบ
        
        this.postService.deletePost(postId).subscribe({
          next: (response) => {
            alert('โพสต์ถูกลบเรียบร้อย');
            this.router.navigate(['/noti_addmin'], { queryParams: { id: this.userId } });
          },
          error: (error) => {
            console.error('Error deleting post:', error);
            alert('เกิดข้อผิดพลาดในการลบโพสต์ กรุณาลองใหม่อีกครั้ง');
            this.isDeletingPost = false; // รีเซ็ตสถานะเมื่อเกิด error
          },
          complete: () => {
            this.isDeletingPost = false; // สิ้นสุดการลบเมื่อเสร็จสิ้น
          }
        });
      }
    });
  }

  navigateToUserProfile(userId: number): void {
    console.log('=== Navigate To User Profile ===');
    console.log('userId (ผู้ใช้ที่เลือก):', userId);
    console.log('userId type:', typeof userId);
    console.log('this.adminId (แอดมิน):', this.adminId);
    console.log('this.adminId type:', typeof this.adminId);
    
    if (!this.adminId) {
      alert('เกิดข้อผิดพลาด: ไม่พบ Admin ID');
      return;
    }
    
    if (!userId) {
      alert('เกิดข้อผิดพลาด: ไม่พบ User ID');
      return;
    }
    
    const params = { id: userId, adminId: this.adminId };
    console.log('Navigating to /admin_profileuser with params:', params);
    console.log('Params type check:', {
      idType: typeof params.id,
      adminIdType: typeof params.adminId,
      idValue: params.id,
      adminIdValue: params.adminId
    });
    
    this.router.navigate(['/admin_profileuser'], {
      queryParams: params
    });
  }

  logout() {
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminId');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminToken');
    this.router.navigate(['/login']);
  }

}
