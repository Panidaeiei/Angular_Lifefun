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
import { Subscription } from 'rxjs';

import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { Follow } from '../../models/follow.model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { UserService } from '../../services/Userservice';
import { ChatService } from '../../services/chat.service';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-user',
  imports: [MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
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
    private router: Router
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

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    this.userService.loadCurrentUserId(); // โหลด userId จาก localStorage เข้า BehaviorSubject
    this.userService.getCurrentUserId().subscribe((userId) => {
      this.currentUserId = userId;
      console.log('Current User ID:', this.currentUserId);
      if (userId) {
        this.userService.getUserById(userId).subscribe(user => {
          this.currentUserProfile = user;
        });
      }
    });

    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      this.userId = storedUserId;  // ดึงค่า userId จาก sessionStorage
      console.log('User ID (ผู้ที่กำลังดูโปรไฟล์):', this.userId);
    } else {
      console.warn('No user ID found in sessionStorage');
    }

    // ดึงค่า userId จาก path parameters (URL)
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('userId') || '';  // รับค่า userId จาก path parameter
      this.cid = params.get('cid') || '';  // ถ้ามี cid ก็จะดึงมา

      if (this.userId) {
        this.loadUserProfile();
        this.loadUserPosts();
        
        // เริ่มการติดตามการแจ้งเตือน
        this.startNotificationTracking();
      } else {
        console.warn('User ID not found in path parameters.');
      }
    });

    // ดึงค่า viewerId จาก query parameters (ค่าที่ส่งมาพร้อม URL เช่น ?viewerId=34)
    this.route.queryParams.subscribe((params) => {
      this.Profileuser = params['Profileuser'] || '';  // รับค่า viewerId จาก query parameter
      console.log('Profileuser ID (เจ้าของโปรไฟล์):', this.Profileuser);  // แสดง viewerId
      if (this.Profileuser) {
        // เซ็ต followedId เป็น Profileuser เพื่อใช้ในการติดตาม
        this.followedId = this.Profileuser;
        console.log('Followed ID set to:', this.followedId);
        
        // ดึงข้อมูลของเจ้าของโปรไฟล์
        this.checkFollowStatus();
        this.loadFollowCount();
        this.loadUserProfile();
        this.loadUserPosts();
      }
    });

    this.checkScreen();
    window.addEventListener('resize', this.checkScreen.bind(this));
  }

  // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.notificationService.loadNotificationCounts(Number(this.userId));
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.notificationService.startAutoUpdate(Number(this.userId));
      
      // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือน
      this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
        (counts) => {
          this.notificationCounts = counts;
          console.log('Notification counts updated:', counts);
        }
      );
    }
  }

  ngOnDestroy(): void {
    // หยุดการติดตามการแจ้งเตือน
    this.notificationService.stopAutoUpdate();
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    
    window.removeEventListener('resize', this.checkScreen.bind(this));
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
          console.log('Owner Profile Data:', this.userProfile);
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
          console.log('User Posts (จากเจ้าของโปรไฟล์):', this.userPosts);
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
  
    const confirmMessage = this.isFollowing
      ? 'คุณแน่ใจหรือไม่ว่าต้องการเลิกติดตาม?'
      : 'คุณแน่ใจหรือไม่ว่าต้องการติดตาม?';
  
    if (confirm(confirmMessage)) { //แสดงป๊อปอัปยืนยัน
      const followData: Follow = {
        following_id: this.userId,
        followed_id: this.Profileuser
      };
  
      console.log('Toggling follow with data:', followData);
      this.reactPostservice.toggleFollow(followData).subscribe(
        (response) => {
          this.isFollowing = response.isFollowing;
          console.log('Follow toggled, new status:', this.isFollowing);
          this.loadFollowCount(); //โหลดจำนวนติดตามใหม่
        },
        (error) => {
          console.error('เกิดข้อผิดพลาดขณะติดตาม:', error);
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

    console.log('Checking follow status for userId:', this.userId, 'Profileuser:', this.Profileuser);
    this.reactPostservice.checkFollowStatus(this.userId, this.Profileuser).subscribe(
      (response) => {
        this.isFollowing = response.isFollowing;
        console.log('Follow status:', this.isFollowing);
      },
      (error) => {
        console.error('Error fetching follow status:', error);
      }
    );
  }

  //โหลดจำนวน Followers & Following
  loadFollowCount(): void {
    if (!this.Profileuser) {
      console.warn('Profileuser is not set, cannot load follow count');
      return;
    }

    console.log('Loading follow count for Profileuser:', this.Profileuser);
    this.reactPostservice.getFollowCount(this.Profileuser).subscribe(
      (response) => {
        this.followersCount = response.followers;
        this.followingCount = response.following;
        console.log('Follow count loaded:', { followers: this.followersCount, following: this.followingCount });
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
    console.log('currentUserId:', this.currentUserId, 'Profileuser:', this.Profileuser);
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
      console.log('Chat ID:', this.chatId);
      
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
          console.log('Messages updated:', this.messages);
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
      console.log('Message sent successfully');
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
}
