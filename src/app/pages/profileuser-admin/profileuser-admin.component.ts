import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminService } from '../../services/Admin';
import { UserService } from '../../services/Userservice';
import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-profileuser-admin',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatIconModule, MatTabsModule, MatButtonModule],
  templateUrl: './profileuser-admin.component.html',
  styleUrl: './profileuser-admin.component.scss'
})
export class ProfileuserAdminComponent {

  userId: string = '';
  adminId: string = '';
  users: User[] = [];
  errorMessage: string = '';
  filteredUsers: User[] = [];
  user: User | null = null;
  isLoading = true;
  userProfile: User | null = null;
  userPosts: Postme[] = [];
  savedPosts: Postme[] = [];
  sharedPosts: Postme[] = [];
  followersCount: number = 0;
  followingCount: number = 0;
  followedId: string = '';
  isDrawerOpen: boolean = false;

  constructor(private route: ActivatedRoute, private userService: UserService, private adminservice: AdminService, private profileService: ProfileService, private reactPostservice: ReactPostservice) { }
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id'];         // นี่คือ user ที่ถูกเลือก (ผู้ใช้ทั่วไป)
      this.adminId = params['adminId'];   // นี่คือ uid ของแอดมิน

      console.log('User ID (ผู้ใช้):', this.userId);
      console.log('Admin ID (แอดมิน):', this.adminId);

      if (this.userId) {
        this.followedId = this.userId;
        this.loadUserProfile();
        this.loadUserPosts();
        this.loadFollowCount();
      } else {
        console.log('No User ID found');
      }
    });

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.filteredUsers = this.users;
      },
      error: (error) => this.errorMessage = error.message
    });
  }


  loadUserProfile(): void {
    if (this.userId) {
      this.profileService.getUserProfileById(this.userId).subscribe(
        (data) => {
          this.userProfile = data;
          console.log('Owner Profile Data:', this.userProfile);
        },
        (error) => {
          console.error('Error fetching owner profile:', error);
          if (error.status === 404) {
            this.userProfile = null;
          }
        }
      );
    }
  }

  loadUserPosts(): void {
    if (this.userId) {
      this.profileService.getUserPostsById(this.userId).subscribe(
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

  toggleBan(user: any) {
    if (!user?.uid) {
      console.error('User ID is missing');
      return;
    }

    if (user.status === 0) {
      // ยกเลิกการระงับบัญชี
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.unbanUser(user.uid).subscribe({
          next: (res) => {
            user.status = 1;
            console.log('ยกเลิกการระงับบัญชีสำเร็จ:', res);
          },
          error: (err) => {
            console.error('เกิดข้อผิดพลาด:', err);
          }
        });
      }
    } else {
      // ระงับบัญชี
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.banUser(user.uid, 'ยังไม่ระบุ', '2025-12-31').subscribe({
          next: (res) => {
            user.status = 0;
            console.log('ระงับบัญชีสำเร็จ:', res);
          },
          error: (err) => {
            console.error('เกิดข้อผิดพลาด:', err);
          }
        });
      }
    }
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

}