import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, take, forkJoin, of } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';

import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { Follow } from '../../models/follow.model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { UserService } from '../../services/Userservice';
import { ChatService } from '../../services/chat.service';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { FollowersDialogComponent } from '../../components/followers-dialog/followers-dialog.component';

@Component({
  selector: 'app-view-user',
  standalone: true,
  imports: [MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    FormsModule],
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss']
})
export class ViewUserComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute, 
    private profileService: ProfileService, 
    private reactPostservice: ReactPostservice,
    private userService: UserService, 
    private cdr: ChangeDetectorRef, 
    private chatService: ChatService, 
    private notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  userId: string = '';
  cid: string = '';
  isDrawerOpen: boolean = false;
  userProfile: User | null = null;
  Profileuser: string = '';
  commentOwner: any = null;
  errorMessage: string = '';
  userPosts: Postme[] = [];  // โพสต์ที่ผู้ใช้สร้างเอง
  savedPosts: Postme[] = [];  // โพสต์ที่บันทึก
  sharedPosts: Postme[] = []; // โพสต์ที่แชร์
  followedId: string = '';  // ID ของผู้ใช้ที่คุณต้องการติดตามหรือเลิกติดตาม
  isFollowing: boolean = false; // สถานะการติดตาม
  followersCount: number = 0;
  followingCount: number = 0;
  currentUserId: string | null = null;
  isMobile: boolean = false;
  messages: any[] = [];
  chatText: string = '';
  chatImage: File | null = null;
  chatVideo: File | null = null;
  chatId: string = '';
  currentUserProfile: User | null = null;
  isChatBoxOpen: boolean = false;
  previewUrl: string | null = null;
  previewType: 'image' | 'video' | null = null;
  hoveredMsgIndex: number | null = null;
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  // เพิ่มตัวแปรเพื่อป้องกันการโหลดซ้ำ
  private isDataLoaded = false;
  private isLoading = false;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    // ตรวจสอบ authentication ก่อน
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    // ตั้งค่า userId ของเจ้าของที่ login อยู่
    this.userId = loggedInUserId;

    // รีเซ็ตสถานะทุกครั้งที่เข้ามา
    this.isDataLoaded = false;
    this.isLoading = false;
    
    // โหลด currentUserId จาก localStorage
    this.userService.loadCurrentUserId();
    
    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['Profileuser']) {
      this.Profileuser = snapshotParams['Profileuser'];
      this.followedId = this.Profileuser;
    }
    
    // Subscribe เฉพาะ params ที่มี Profileuser เท่านั้น และป้องกันการโหลดซ้ำ
    const routeSub = this.route.queryParams
      .pipe(
        filter((params: any) => !!params['Profileuser']),
        take(1) // รับค่าแค่ครั้งแรก
      )
      .subscribe((params: any) => {
        if (!this.isDataLoaded) {
          this.Profileuser = params['Profileuser'];
          this.followedId = this.Profileuser;
          
          // อัปเดต userId ของเจ้าของที่ login อยู่
          const currentLoggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
          if (currentLoggedInUserId) {
            this.userId = currentLoggedInUserId;
          }
        }
      });
    
    this.subscriptions.add(routeSub);

    // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
    const userSub = this.userService.getCurrentUserId()
      .pipe(take(1)) // รับค่าแค่ครั้งเดียว
      .subscribe((currentUserId: string | null) => {
        if (currentUserId && !this.isDataLoaded) {
          this.currentUserId = currentUserId;
          // โหลดข้อมูลเฉพาะครั้งแรก
          this.loadUserDataFast();
          
          // เพิ่มการตรวจสอบสถานะการติดตามหลังจากโหลดข้อมูลเสร็จ
          if (this.Profileuser && this.userId) {
            setTimeout(() => {
              this.checkFollowStatus();
            }, 1000); // รอให้ข้อมูลโหลดเสร็จก่อน
          }
        }
      });
    
    this.subscriptions.add(userSub);

    this.checkScreen();
    window.addEventListener('resize', this.checkScreen.bind(this));
  }

  // หยุดการเช็ค notification (ไม่ต้องยิง API notification)
  // private startNotificationTracking(): void {
  //   if (this.userId) {
  //     // โหลดการแจ้งเตือนครั้งแรก
  //     this.notificationService.loadNotificationCounts(Number(this.userId));
  //     
  //     // เริ่มการอัปเดตอัตโนมัติ
  //     this.notificationService.startAutoUpdate(Number(this.userId));
  //     
  //     // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือน
  //     this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
  //       counts => {
  //         this.notificationCounts = counts;
  //       }
  //     );
  //   }
  // }

  ngOnDestroy(): void {
    // หยุดการติดตามการแจ้งเตือน (ไม่ต้องยิง API notification)
    // this.notificationService.stopAutoUpdate(); // ❌ Comment ออก
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    
    // ยกเลิก subscriptions ทั้งหมด
    this.subscriptions.unsubscribe();
    
    // รีเซ็ตสถานะ
    this.isDataLoaded = false;
    this.isLoading = false;
    
    // ล้างข้อมูล
    this.userProfile = null;
    this.userPosts = [];
    this.sharedPosts = [];
    this.savedPosts = [];
    this.followersCount = 0;
    this.followingCount = 0;
    
    window.removeEventListener('resize', this.checkScreen.bind(this));
  }

  // ฟังก์ชันใหม่สำหรับโหลดข้อมูลแบบเร็ว
  private loadUserDataFast(): void {
    if (this.Profileuser && !this.isDataLoaded) {
      this.isLoading = true;
      this.isDataLoaded = true; // ป้องกันการโหลดซ้ำ
      
      // โหลดข้อมูลทั้งหมดพร้อมกันแบบเร็ว
      const userProfile$ = this.profileService.getUserProfileById(this.Profileuser).pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error loading profile:', error);
          return of(null);
        }),
        take(1)
      );

      const userPosts$ = this.profileService.getUserPostsById(this.Profileuser).pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error loading posts:', error);
          return of({ userPosts: [], sharedPosts: [], savedPosts: [] });
        }),
        take(1)
      );

      // ไม่ต้องเรียก getFollowCount() แยกแล้ว เพราะข้อมูล followers และ following มาพร้อมกับ getUserProfileById

      // เพิ่มการตรวจสอบสถานะการติดตาม
      const followStatus$ = this.reactPostservice.checkFollowStatus(this.userId, this.Profileuser).pipe(
        timeout(10000),
        catchError(error => {
          console.error('Error checking follow status:', error);
          return of({ isFollowing: false });
        }),
        take(1)
      );

      // โหลดข้อมูลทั้งหมดพร้อมกัน
      forkJoin({
        profile: userProfile$,
        posts: userPosts$,
        followStatus: followStatus$
      }).pipe(
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe({
        next: (data) => {
          // อัปเดตข้อมูลผู้ใช้
          this.userProfile = data.profile;
          
          // อัปเดตข้อมูลการติดตามจาก profile data
          this.followersCount = data.profile?.followers || 0;
          this.followingCount = data.profile?.following || 0;
          
          // อัปเดตข้อมูลโพสต์
          this.userPosts = data.posts.userPosts || [];
          this.sharedPosts = data.posts.sharedPosts || [];
          this.savedPosts = data.posts.savedPosts || [];
          
          // อัปเดตสถานะการติดตาม
          this.isFollowing = data.followStatus.isFollowing || false;
          
          // หยุดการเช็ค notification (ไม่ต้องยิง API notification)
          // this.startNotificationTracking(); // ❌ Comment ออก
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  checkScreen() {
    this.isMobile = window.innerWidth <= 600;
    this.cdr.detectChanges();
  }

  loadUserProfile(): void {
    if (this.Profileuser) {
      this.profileService.getUserProfileById(this.Profileuser).subscribe(
        (data) => {
          this.userProfile = data;  // เก็บข้อมูลโปรไฟล์ของเจ้าของโปรไฟล์
        },
        (error) => {
          console.error('Error fetching owner profile:', error);
          if (error.status === 404) {
            this.userProfile = null; // ไม่พบข้อมูลของเจ้าของโปรไฟล์
          }
        }
      );
    }
  }

  loadUserPosts(): void {
    if (this.Profileuser) {
      this.profileService.getUserPostsById(this.Profileuser).subscribe(
        (data) => {
          this.userPosts = data.userPosts;  // โพสต์ของเจ้าของโปรไฟล์
          this.savedPosts = data.savedPosts;  // โพสต์ที่บันทึก
          this.sharedPosts = data.sharedPosts; // โพสต์ที่แชร์
        },
        (error) => {
          this.errorMessage = 'ไม่สามารถดึงข้อมูลโพสต์ได้';
          console.error('Error fetching posts:', error);
        }
      );
    }
  }

  toggleFollow(): void {
    if (!this.Profileuser) {
      console.error('Profileuser ไม่ถูกต้อง:', this.Profileuser);
      return;
    }

    // ตรวจสอบและอัปเดต userId ของเจ้าของที่ login อยู่
    if (!this.userId) {
      this.userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';
      if (!this.userId) {
        console.error('ไม่พบ userId ของเจ้าของที่ login อยู่');
        return;
      }
    }
  
    const confirmMessage = this.isFollowing
      ? 'คุณแน่ใจหรือไม่ว่าต้องการเลิกติดตาม?'
      : 'คุณแน่ใจหรือไม่ว่าต้องการติดตาม?';
  
    if (confirm(confirmMessage)) { //แสดงป๊อปอัปยืนยัน
      const followData: Follow = {
        following_id: this.userId,
        followed_id: this.Profileuser
      };
  
      this.reactPostservice.toggleFollow(followData).subscribe(
        (response) => {
          // อัปเดตสถานะทันที
          this.isFollowing = response.isFollowing;
          // console.log('Follow status toggled to:', this.isFollowing);
          
          // อัปเดตจำนวนผู้ติดตามใหม่
          this.loadFollowCount();
          
          // บังคับให้ UI อัปเดต
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดขณะติดตาม:', error);
          // ถ้า error ให้ตรวจสอบสถานะใหม่
          setTimeout(() => {
            this.checkFollowStatus();
          }, 1000);
        }
      );
    }
  }
  

  //ตรวจสอบสถานะการติดตาม
  checkFollowStatus(): void {
    if (!this.userId || !this.Profileuser) {
      console.warn('userId or Profileuser is not set, cannot check follow status');
      return;
    }

    // เพิ่ม timeout และ error handling
    this.reactPostservice.checkFollowStatus(this.userId, this.Profileuser).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Error checking follow status:', error);
        return of({ isFollowing: false });
      }),
      take(1)
    ).subscribe(
      (response) => {
        this.isFollowing = response.isFollowing;
        // console.log('Follow status updated:', this.isFollowing);
        this.cdr.detectChanges(); // บังคับให้ UI อัปเดต
      },
      (error) => {
        console.error('Error fetching follow status:', error);
        // ไม่ต้องทำอะไร ถ้า error ให้ใช้ค่าเดิม
      }
    );
  }

  //โหลดจำนวน Followers & Following
  loadFollowCount(): void {
    if (!this.Profileuser) {
      console.warn('Profileuser is not set, cannot load follow count');
      return;
    }

    this.reactPostservice.getFollowCount(this.Profileuser).subscribe(
      (response) => {
        this.followersCount = response.followers;
        this.followingCount = response.following;
      },
      (error) => {
        console.error('Error fetching follow count:', error);
      }
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  getChatId(): string {
    // ใช้ id ของ user ปัจจุบันและเจ้าของโปรไฟล์ (เรียงลำดับเพื่อไม่ให้ซ้ำ)
    if (!this.currentUserId || !this.Profileuser) return '';
    return [this.currentUserId, this.Profileuser].sort().join('_');
  }

  toggleChatBox() {
    if (!this.currentUserId || !this.Profileuser) {
      alert('ไม่สามารถเปิดแชทได้: ไม่พบข้อมูลผู้ใช้');
      return;
    }
    this.isChatBoxOpen = !this.isChatBoxOpen;
    if (this.isChatBoxOpen) {
      this.initializeChat();
    }
  }

  initializeChat() {
    // รอให้ currentUserId และ Profileuser ถูกเซ็ตก่อน
    if (this.currentUserId && this.Profileuser) {
      this.chatId = this.getChatId();
      
      if (this.chatId) {
        // เพิ่ม users เข้า chat index เมื่อเปิดแชทครั้งแรก
        if (this.currentUserProfile && this.userProfile) {
          this.chatService.addUserToChat(
            this.chatId,
            {
              user_id: this.currentUserId,
              username: this.currentUserProfile.username || '',
              image_url: this.currentUserProfile.image_url || ''
            },
            {
              user_id: this.Profileuser,
              username: this.userProfile.username || '',
              image_url: this.userProfile.image_url || ''
            }
          );
        }

        this.chatService.listenMessages(this.chatId, (msgs) => {
          this.messages = msgs;
          this.cdr.detectChanges();
        });
      }
    } else {
      console.warn('Cannot initialize chat: missing user IDs');
    }
  }

  onChatFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        this.chatImage = file;
        this.chatVideo = null;
        this.previewType = 'image';
        this.previewUrl = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        this.chatVideo = file;
        this.chatImage = null;
        this.previewType = 'video';
        this.previewUrl = URL.createObjectURL(file);
      }
    }
  }

  clearPreview() {
    this.chatImage = null;
    this.chatVideo = null;
    this.previewUrl = null;
    this.previewType = null;
  }

  async sendChatMessage() {
    if (!this.currentUserId || !this.Profileuser || !this.chatId) {
      console.error('Cannot send message: missing required data');
      return;
    }
    
    if (!this.chatText.trim() && !this.chatImage && !this.chatVideo) {
      console.warn('No message content to send');
      return;
    }

    let pendingMsg: any = null;
    if (this.chatImage) {
      pendingMsg = {
        uid: this.currentUserId,
        text: this.chatText,
        image_url: this.previewUrl,
        video_url: '',
        type: 2,
        create_at: new Date().toISOString(),
        pending: true
      };
      this.messages = [...this.messages, pendingMsg];
      this.cdr.detectChanges();
    }

    try {
      let imageUrl = '';
      let videoUrl = '';
      if (this.chatImage) {
        imageUrl = await this.chatService.uploadImage(this.chatImage, this.chatId, this.currentUserId);
      }
      if (this.chatVideo) {
        videoUrl = await this.chatService.uploadVideo(this.chatVideo, this.chatId, this.currentUserId);
      }
      await this.chatService.sendMessage(
        this.chatId,
        this.currentUserId,
        this.chatText,
        imageUrl,
        videoUrl
      );
      // ลบ pending message ออก (ถ้ามี)
      if (pendingMsg) {
        this.messages = this.messages.filter(m => m !== pendingMsg);
      }
      this.chatText = '';
      this.chatImage = null;
      this.chatVideo = null;
      this.previewUrl = null;
      this.previewType = null;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  shouldShowTime(index: number): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1];
    const curr = this.messages[index];
    if (!prev || !curr) return true;
    // แสดงเวลาถ้าห่างกันเกิน 5 นาที
    const prevTime = new Date(prev.create_at).getTime();
    const currTime = new Date(curr.create_at).getTime();
    return (currTime - prevTime) > 5 * 60 * 1000;
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

  openFollowersDialog(): void {
    if (!this.Profileuser) {
      console.error('Profileuser is not set for followers dialog');
      return;
    }
    const dialogRef = this.dialog.open(FollowersDialogComponent, {
      data: { userId: this.Profileuser }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog closed
    });
  }

  // ฟังก์ชันเปิด popup แสดงรายชื่อผู้ติดตาม
  openFollowersPopup(): void {
    const dialogRef = this.dialog.open(FollowersDialogComponent, {
      width: '400px',
      maxHeight: '70vh',
      data: { userId: this.Profileuser, type: 'followers' }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog closed
    });
  }

  // ฟังก์ชันเปิด popup แสดงรายชื่อผู้ที่เราติดตาม
  openFollowingPopup(): void {
    const dialogRef = this.dialog.open(FollowersDialogComponent, {
      width: '400px',
      maxHeight: '70vh',
      data: { userId: this.Profileuser, type: 'following' }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Dialog closed
    });
  }

  // ตรวจสอบว่าเป็นโปรไฟล์ของตัวเองหรือไม่
  isOwnProfile(): boolean {
    return this.userId === this.Profileuser;
  }
}
