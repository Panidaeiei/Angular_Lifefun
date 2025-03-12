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
import { ReactPostservice } from '../../services/ReactPostservice';

@Component({
  selector: 'app-profile-user',
  standalone: true, // ใช้ standalone component
  imports: [
    MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.scss'],
})
export class ProfileUserComponent implements OnInit {
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  user: User | null = null; // เก็บข้อมูลผู้ใช้
  posts: Postme[] = [];
  isLoading = true;
  sharedPosts: Postme[] = [];
  savePosts: Postme[] = [];
  userProfile: User | null = null;
  viewerId: string = '';
  followersCount: number = 0;
  followingCount: number = 0;
  followedId: string = '';

  constructor(private route: ActivatedRoute, private profileService: ProfileService, private reactPostservice: ReactPostservice,) { }

  ngOnInit(): void {
    // ดึงข้อมูล User ID จาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID:', this.userId);

        // เรียกฟังก์ชันเมื่อมีค่า userId
        this.getUserProfile();
        this.getUserPosts();
        this.getSharedPosts();
        this.getSavePosts();

        this.loadFollowCount();
      } else {
        this.userId = ''; // กำหนดค่าเริ่มต้นเมื่อไม่มี User ID
        console.warn('User ID not found in query parameters.');
      }
    });
  }

  // ดึงข้อมูลโปรไฟล์ผู้ใช้
  getUserProfile(): void {
    this.profileService.getUserProfile().subscribe(
      (data) => {
        this.user = data; // เก็บข้อมูลผู้ใช้
        console.log('User data:', this.user);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching user profile:', error);
        this.isLoading = false;
      }
    );
  }

  getUserPosts(): void {
    this.profileService.getPostsMe().subscribe(
      (data) => {
        // ตรวจสอบและกรองข้อมูลก่อนอัปเดต
        this.posts = data.userPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false // กำหนดค่าเริ่มต้นถ้าไม่มี
        }));
        console.log('User posts:', this.posts);
      },
      (error) => {
        console.error('Error fetching user posts:', error);
      }
    );
  }

  getSharedPosts(): void {
    this.profileService.getPostsMe().subscribe(
      (data) => {
        this.sharedPosts = data.sharedPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
        console.log('Shared posts:', this.sharedPosts);
      },
      (error) => {
        console.error('Error fetching shared posts:', error);
      }
    );
  }

  getSavePosts(): void {
    this.profileService.getPostsMe().subscribe(
      (data) => {
        this.savePosts = data.savedPosts.map((post) => ({
          ...post,
          hasMultipleMedia: post.hasMultipleMedia || false
        }));
        console.log('Shared posts:', this.savePosts);
      },
      (error) => {
        console.error('Error fetching shared posts:', error);
      }
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  loadFollowCount(): void {
    const targetId = this.userId || this.followedId; // ใช้ userId ถ้าเป็นโปรไฟล์ตัวเอง

    if (!targetId) {
      console.warn('⚠️ ไม่สามารถโหลดข้อมูลติดตามได้: ไม่มี userId หรือ followedId');
      return;
    }

    this.reactPostservice.getFollowCount(targetId).subscribe(
      (response) => {
        this.followersCount = response.followers;
        this.followingCount = response.following;
        console.log(`จำนวนผู้ติดตาม: ${this.followersCount}, จำนวนที่ติดตาม: ${this.followingCount}`);
      },
      (error) => {
        console.error('เกิดข้อผิดพลาดขณะโหลดจำนวนผู้ติดตาม:', error);
      }
    );
  }


}
