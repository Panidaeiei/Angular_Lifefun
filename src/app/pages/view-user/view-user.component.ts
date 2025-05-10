import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { Follow } from '../../models/follow.model';
import { ReactPostservice } from '../../services/ReactPostservice';

@Component({
  selector: 'app-view-user',
  imports: [MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule],
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss']
})
export class ViewUserComponent {
  constructor(private route: ActivatedRoute, private profileService: ProfileService, private reactPostservice: ReactPostservice,) { }

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

  ngOnInit(): void {
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
      } else {
        console.warn('User ID not found in path parameters.');
      }
    });


    this.route.paramMap.subscribe((params) => {
      this.cid = params.get('cid') || '';

      if (params.get('userId')) {
        this.followedId = params.get('userId') || '';  // ให้ followedId เป็น userId ของโปรไฟล์ที่กำลังดู
        console.log('Followed ID (โปรไฟล์ที่กำลังดูอยู่):', this.followedId);

      }
    });

    this.route.queryParams.subscribe((params) => {
      this.Profileuser = params['Profileuser'] || '';
      console.log('Profileuser ID (เจ้าของโปรไฟล์ที่ต้องติดตาม):', this.Profileuser);

      if (this.Profileuser) {
        this.followedId = this.Profileuser;
      }
    });

    // ดึงค่า viewerId จาก query parameters (ค่าที่ส่งมาพร้อม URL เช่น ?viewerId=34)
    this.route.queryParams.subscribe((params) => {
      this.Profileuser = params['Profileuser'] || '';  // รับค่า viewerId จาก query parameter
      console.log('Profileuser ID (เจ้าของโปรไฟล์):', this.Profileuser);  // แสดง viewerId
      if (this.Profileuser) {
        // ดึงข้อมูลของเจ้าของโปรไฟล์
        this.checkFollowStatus();
        this.loadFollowCount();
        this.loadUserProfile();
        this.loadUserPosts();
      }
    });
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
    if (!this.followedId) {
      console.error('Followed ID ไม่ถูกต้อง:', this.followedId);
      return;
    }
  
    const confirmMessage = this.isFollowing
      ? 'คุณแน่ใจหรือไม่ว่าต้องการเลิกติดตาม?'
      : 'คุณแน่ใจหรือไม่ว่าต้องการติดตาม?';
  
    if (confirm(confirmMessage)) { //แสดงป๊อปอัปยืนยัน
      const followData: Follow = {
        following_id: this.userId,
        followed_id: this.followedId
      };
  
      this.reactPostservice.toggleFollow(followData).subscribe(
        (response) => {
          this.isFollowing = response.isFollowing;
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
    if (!this.userId || !this.followedId) return;

    this.reactPostservice.checkFollowStatus(this.userId, this.followedId).subscribe(
      (response) => {
        this.isFollowing = response.isFollowing;
      },
      (error) => {
        console.error('Error fetching follow status:', error);
      }
    );
  }

  //โหลดจำนวน Followers & Following
  loadFollowCount(): void {
    if (!this.followedId) return;

    this.reactPostservice.getFollowCount(this.followedId).subscribe(
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
}
