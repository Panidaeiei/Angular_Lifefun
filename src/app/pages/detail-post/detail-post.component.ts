import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, OnDestroy } from '@angular/core';
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
import { SharePostModel } from '../../models/sharepost_model';
import { SavePostModel } from '../../models/savepost_service';
import { ReportDialogComponent } from '../report-dialog/report-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-detail-post',
  standalone: true,
  imports: [
    MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, NewlineToBrPipe, FormsModule, TimeAgoPipe, FormatLocalTimePipe, MatTooltipModule
  ],
  templateUrl: './detail-post.component.html',
  styleUrls: ['./detail-post.component.scss']
})
export class DetailPostComponent implements OnInit, OnDestroy {
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
  saveCount: number = 0; // เพิ่มตัวแปรสำหรับจำนวนการบันทึกโพสต์
  currentUserId: string | null = null;
  viewerId: string = '';
  touchStartX = 0;
  touchEndX = 0;
  touchStartY = 0;
  touchEndY = 0;
  isMobile: boolean = false;
  isDeletingPost: boolean = false; // เพิ่ม loading state สำหรับการลบโพสต์
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  @ViewChild('commentInput') commentInput!: ElementRef;
  @ViewChildren(MatMenuTrigger) menuTriggers!: QueryList<MatMenuTrigger>;


  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService, private postService: PostService, private reactPostservice: ReactPostservice, public dialog: MatDialog, private notificationService: NotificationService) { }

  // ฟังก์ชันแปลงชื่อหมวดหมู่เป็นภาษาไทย
  getCategoryNameThai(categoryName: string): string {
    const categoryMap: { [key: string]: string } = {
      'food': 'อาหาร',
      'travel': 'ท่องเที่ยว',
      'health': 'สุขภาพ',
      'fashion': 'แฟชั่น',
      'skincare': 'สกินแคร์',
      'cosmetics': 'เครื่องสำอาง',
    };
    
    return categoryMap[categoryName.toLowerCase()] || categoryName;
  }

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    this.checkScreenSize();
    window.addEventListener('resize', this.onResize.bind(this));
    
    // โหลด currentUserId จาก localStorage ก่อน
    this.userService.loadCurrentUserId();
    
    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['post_id'] && snapshotParams['user_id']) {
      this.postId = snapshotParams['post_id'];
      this.userId = snapshotParams['user_id'];
      this.initializePostData();
    }
    
    // Subscribe เฉพาะเมื่อ params เปลี่ยน
    this.route.queryParams
      .pipe(filter((params: any) => !!params['post_id'] && !!params['user_id']))
      .subscribe((params: any) => {
        if (params['post_id'] !== this.postId || params['user_id'] !== this.userId) {
          this.postId = params['post_id'];
          this.userId = params['user_id'];
          this.initializePostData();
        }
      });

    // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
    this.userService.getCurrentUserId().subscribe((currentUserId: string | null) => {
      const urlUserId = this.route.snapshot.queryParams['user_id'];
      
      if (urlUserId && currentUserId && urlUserId !== currentUserId) {
        // ถ้า id ใน url ไม่ตรงกับ id ที่ล็อกอินไว้ ให้ redirect ออก
        this.router.navigate(['/login']);
        return;
      }
    });

    // การ subscribe กับ likeStatus$
    this.reactPostservice.likeStatus$.subscribe((status) => {
      // ดำเนินการที่ต้องการเมื่อไลค์เปลี่ยนแปลง
    });

    // ดึง currentUserId
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      
      // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
      const urlUserId = this.route.snapshot.queryParams['user_id'];
      if (urlUserId && userId && urlUserId !== userId) {
        this.router.navigate(['/login']);
        return;
      }
    });
  }

  // เพิ่มเมธอดช่วยสำหรับเริ่มต้นข้อมูลโพสต์
  private initializePostData(): void {
    this.fetchPost(this.postId);
    this.loadComments(Number(this.postId));
    // this.loadShareStatus(); // removed: unified by getPostStats
    // this.loadSaveStatus(); // removed: unified by getPostStats
    this.startNotificationTracking();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    
    // ไม่ต้องหยุดการติดตามการแจ้งเตือนอีกต่อไป - ใช้ localStorage เท่านั้น
    // this.notificationService.stopAutoUpdate();
    
    // ยกเลิก subscription (ถ้ามี)
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดข้อมูลจาก localStorage เท่านั้น (ไม่เรียก backend)
      this.loadNotificationCountsFromStorage();
      
      // ไม่เรียก API อีกต่อไป - ใช้ข้อมูลจาก localStorage เท่านั้น
      // this.notificationService.loadNotificationCounts(Number(this.userId));
      
      // ไม่ต้อง subscribe อีกต่อไป - ใช้ข้อมูลจาก localStorage เท่านั้น
      // this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
      //   (counts) => {
      //     this.notificationCounts = counts;
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
        
        // ตรวจสอบว่ามีรูปหรือวิดีโอหรือไม่
        const totalMedia = (this.post.images?.length || 0) + (this.post.videos?.length || 0);
        
        this.updateCurrentMedia(); // เรียกอัปเดต media หลังจากโหลดโพสต์

        // เรียกสถิติรวมแบบเส้นเดียว
        this.postService.getPostStats(postIdNumber).subscribe({
          next: (stats) => {
            // อัปเดตค่าต่าง ๆ จากสถิติ
            // likes_count ในหน้ารายละเอียดเก็บที่ post?.likes_count ถ้ามี หรือใช้ตัวแปรแยกตามที่มีอยู่
            if (this.post) {
              (this.post as any).likes_count = stats.likes_count ?? (this.post as any).likes_count ?? 0;
            }
            this.shareCount = stats.share_count ?? this.shareCount;
            this.saveCount = stats.save_count ?? this.saveCount;
            // ถ้ามีการเก็บ comment_count ในส่วนแสดงผล ให้คุณใช้ตัวแปรแยกหรือเพิ่มได้ตามต้องการ
            // เช่น this.commentCount = stats.comment_count;

            this.isLiked = !!stats.isLiked;
            this.isShared = !!stats.isShared;
            this.isSave = !!stats.isSaved;

            if (this.post) {
              (this.post as any).isLiked = this.isLiked;
              (this.post as any).isShared = this.isShared;
              (this.post as any).isSave = this.isSave;
            }
          },
          error: (err) => {
            console.error('Error fetching post stats:', err);
          }
        });
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
        // อัปเดตจำนวนการแชร์จาก response (ถ้ามี) หรือใช้ localStorage
        if (response.share_count !== undefined) {
          this.shareCount = response.share_count;
          // บันทึกลง localStorage เพื่อใช้เป็น fallback
          const key = `share_count_${this.postId}`;
          localStorage.setItem(key, this.shareCount.toString());
        } else {
          // ใช้ข้อมูลจาก localStorage
          this.loadShareCountFromStorage();
        }
      },
      (error) => {
        console.error('Error loading post status:', error);
        // ใช้ข้อมูลจาก localStorage เมื่อ API error
        this.loadShareCountFromStorage();
      }
    );

    // โหลดจำนวนการแชร์จาก API ใหม่
    this.loadShareCount();
  }

  loadSaveStatus(): void {
    this.reactPostservice.getSaveStatus(Number(this.postId)).subscribe(
      (response) => {
        this.isSave = response.isSave;
        // โหลดจำนวนการบันทึกจาก localStorage
        this.loadSaveCountFromStorage();
      },
      (error) => {
        console.error('Error loading save status:', error);
        // ใช้ข้อมูลจาก localStorage เมื่อ API error
        this.loadSaveCountFromStorage();
      }
    );

    // โหลดจำนวนการเซฟจาก API ใหม่
    this.loadSaveCount();
  }

  // เพิ่มฟังก์ชันสำหรับจัดการจำนวนการบันทึกใน localStorage
  private updateSaveCount(increment: boolean): void {
    const key = `save_count_${this.postId}`;
    let currentCount = parseInt(localStorage.getItem(key) || '0');
    
    if (increment) {
      currentCount++;
    } else {
      currentCount = Math.max(0, currentCount - 1);
    }
    
    localStorage.setItem(key, currentCount.toString());
    this.saveCount = currentCount;
  }

  // เพิ่มเมธอดช่วยสำหรับอัปเดตจำนวนการบันทึกใน localStorage
  private updateSaveCountInStorage(count: number): void {
    const key = `save_count_${this.postId}`;
    localStorage.setItem(key, count.toString());
    this.saveCount = count;
  }

  private loadSaveCountFromStorage(): void {
    const key = `save_count_${this.postId}`;
    this.saveCount = parseInt(localStorage.getItem(key) || '0');
  }

  // เพิ่มฟังก์ชันสำหรับจัดการจำนวนการแชร์ใน localStorage
  private updateShareCount(increment: boolean): void {
    const key = `share_count_${this.postId}`;
    let currentCount = parseInt(localStorage.getItem(key) || '0');
    
    if (increment) {
      currentCount++;
    } else {
      currentCount = Math.max(0, currentCount - 1);
    }
    
    localStorage.setItem(key, currentCount.toString());
    this.shareCount = currentCount;
  }

  // เพิ่มเมธอดช่วยสำหรับอัปเดตจำนวนการแชร์ใน localStorage
  private updateShareCountInStorage(count: number): void {
    const key = `share_count_${this.postId}`;
    localStorage.setItem(key, count.toString());
    this.shareCount = count;
  }

  private loadShareCountFromStorage(): void {
    const key = `share_count_${this.postId}`;
    this.shareCount = parseInt(localStorage.getItem(key) || '0');
  }

  // ฟังก์ชันดึงจำนวนการแชร์จาก API
  loadShareCount(): void {
    // ใช้เฉพาะเมื่อต้องการโหลดข้อมูลใหม่จาก server
    // ไม่ควรเรียกบ่อยเกินไปเพื่อลดการใช้งาน API
    this.reactPostservice.getShareCount(Number(this.postId)).subscribe(
      (response) => {
        this.shareCount = response.share_count;
        // บันทึกลง localStorage
        this.updateShareCountInStorage(this.shareCount);
      },
      (error) => {
        console.error('Error loading share count:', error);
        // ใช้ข้อมูลจาก localStorage เมื่อ API error
        this.loadShareCountFromStorage();
      }
    );
  }

  // ฟังก์ชันดึงจำนวนการเซฟจาก API
  loadSaveCount(): void {
    // ใช้เฉพาะเมื่อต้องการโหลดข้อมูลใหม่จาก server
    // ไม่ควรเรียกบ่อยเกินไปเพื่อลดการใช้งาน API
    this.reactPostservice.getSaveCount(Number(this.postId)).subscribe(
      (response) => {
        this.saveCount = response.save_count;
        // บันทึกลง localStorage
        this.updateSaveCountInStorage(this.saveCount);
      },
      (error) => {
        console.error('Error loading save count:', error);
        // ใช้ข้อมูลจาก localStorage เมื่อ API error
        this.loadSaveCountFromStorage();
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
      // ใช้ฟังก์ชันจัดลำดับอัตโนมัติ
      const allMedia = this.autoArrangeMedia();
      
      console.log('ลำดับไฟล์ที่จัดแล้ว:', allMedia);
      console.log('ข้อมูลลำดับ:', this.getMediaOrderInfo());
      
      // ตรวจสอบว่า currentMediaIndex อยู่ในช่วงที่ถูกต้อง
      if (this.currentMediaIndex >= 0 && this.currentMediaIndex < allMedia.length) {
        this.currentMedia = allMedia[this.currentMediaIndex];
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
    }
  }

  prevMedia(): void {
    if (this.post && (this.post.images.length + this.post.videos.length) > 1) {  // ตรวจสอบ post ว่ามีข้อมูลและมีหลาย media
      const totalMedia = this.post.images.length + this.post.videos.length;
      this.currentMediaIndex = (this.currentMediaIndex - 1 + totalMedia) % totalMedia;
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
    // เรียกใช้ LikePostService เพื่ออัปเดตสถานะการไลค์ในฐานข้อมูล
    this.reactPostservice.likePost(post.post_id, Number(userId)).subscribe(
      (response) => {
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

  // ฟังก์ชันจัดลำดับไฟล์แบบอัตโนมัติ
  autoArrangeMedia(): { type: string; url: string }[] {
    if (!this.post) return [];
    
    const allMedia: { type: string; url: string }[] = [];
    
    // ตรวจสอบว่ามีวิดีโอหรือไม่
    const hasVideo = this.post.videos && this.post.videos.length > 0;
    const hasImage = this.post.images && this.post.images.length > 0;
    
    if (hasVideo && hasImage) {
      // ถ้ามีทั้งวิดีโอและรูปภาพ ให้วิดีโอขึ้นก่อน
      // ใช้ logic: วิดีโอที่เลือกมาเป็นไฟล์แรก
      allMedia.push(...this.post.videos.map((url) => ({ type: 'video', url })));
      allMedia.push(...this.post.images.map((url) => ({ type: 'image', url })));
      
      console.log('จัดลำดับอัตโนมัติ: วิดีโอขึ้นก่อน รูปภาพตามหลัง');
    } else if (hasVideo) {
      // มีแค่วิดีโอ
      allMedia.push(...this.post.videos.map((url) => ({ type: 'video', url })));
      console.log('มีแค่วิดีโอ:', allMedia.length, 'ไฟล์');
    } else if (hasImage) {
      // มีแค่รูปภาพ
      allMedia.push(...this.post.images.map((url) => ({ type: 'image', url })));
      console.log('มีแค่รูปภาพ:', allMedia.length, 'ไฟล์');
    }
    
    return allMedia;
  }

  // ฟังก์ชันแสดงข้อมูลลำดับไฟล์
  getMediaOrderInfo(): string {
    if (!this.post) return 'ไม่มีข้อมูลโพสต์';
    
    const videoCount = this.post.videos?.length || 0;
    const imageCount = this.post.images?.length || 0;
    
    if (videoCount > 0 && imageCount > 0) {
      return `วิดีโอ ${videoCount} ไฟล์ + รูปภาพ ${imageCount} ไฟล์ (วิดีโอขึ้นก่อน)`;
    } else if (videoCount > 0) {
      return `วิดีโอ ${videoCount} ไฟล์`;
    } else if (imageCount > 0) {
      return `รูปภาพ ${imageCount} ไฟล์`;
    } else {
      return 'ไม่มีไฟล์';
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
            this.router.navigate(['/HomepageUser'], { queryParams: { id: this.userId } });
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
        
        // อัปเดตจำนวนการบันทึกจาก response (ถ้ามี) หรือใช้ localStorage
        if (response.save_count !== undefined) {
          this.updateSaveCountInStorage(response.save_count);
        } else {
          // ใช้ localStorage ถ้า API ไม่ส่ง save_count กลับมา
          this.updateSaveCount(this.isSave);
        }
        
        // ไม่ต้องเรียก API ซ้ำ - ใช้ข้อมูลจาก response แทน
        // this.loadSaveCount();
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
      ? 'คุณต้องการยกเลิกการรีโพสต์นี้หรือไม่?'
      : 'คุณต้องการรีโพสต์นี้หรือไม่?';

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
            this.isShared = true; // ตั้งค่าสถานะว่าแชร์แล้ว
            // อัปเดตจำนวนการแชร์
            this.updateShareCount(true);
          } else if (response.message === 'Post unshared successfully.') {
            this.isShared = false;
            // อัปเดตจำนวนการแชร์
            this.updateShareCount(false);
          }
          
          // ไม่ต้องเรียก API ซ้ำ - ใช้ข้อมูลจาก localStorage แทน
          // this.loadShareCount();
        },
        (error) => {
          console.error('Error sharing/unsharing post:', error);
          alert('เกิดข้อผิดพลาดในการดำเนินการ');
        }
      );
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
    
    // ตรวจสอบว่าเป็นการเลื่อนแนวนอนหรือแนวตั้ง
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    // ถ้าเป็นการเลื่อนแนวนอนและมีระยะทางมากกว่า 50px
    if (isHorizontalSwipe && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // เลื่อนไปทางขวา (รูปถัดไป)
        this.nextMedia();
      } else {
        // เลื่อนไปทางซ้าย (รูปก่อนหน้า)
        this.prevMedia();
      }
    }
    
    // รีเซ็ตค่า
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.touchStartY = 0;
    this.touchEndY = 0;
  }

  logout() {
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