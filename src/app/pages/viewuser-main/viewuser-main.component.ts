import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../services/Profileservice';
import { ReactPostservice } from '../../services/ReactPostservice';
import { Postme } from '../../models/postme_model';
import { User } from '../../models/register_model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-viewuser-main',
  imports: [MatToolbarModule,
      RouterModule,
      CommonModule,
      MatTabsModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,],
  templateUrl: './viewuser-main.component.html',
  styleUrl: './viewuser-main.component.scss'
})
export class ViewuserMainComponent {
  
  constructor(private route: ActivatedRoute, private profileService: ProfileService, private reactPostservice: ReactPostservice,private router: Router) {}

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
    isDialogOpen = false; 
 

    ngOnInit(): void {
      this.route.queryParams.subscribe(params => {
        const profileUserId = params['Profileuser'];
        if (profileUserId) {
          this.Profileuser = profileUserId;
          this.followedId = profileUserId;
          this.loadUserProfile();
          this.loadUserPosts();
          this.loadFollowCount();
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

  onloginClick(): void {
    if (!this.isUserLoggedIn()) {  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
      this.openDialog();
    } else {
      // ทำการเพิ่มไลค์หรือดำเนินการอื่น ๆ
      console.log("User has liked the post.");
    }
  }

  isUserLoggedIn(): boolean {
    return false; // สมมุติว่า user ยังไม่ได้เข้าสู่ระบบ
  }

  openDialog() {
    this.isDialogOpen = true;
  }

  closeDialog() {
    this.isDialogOpen = false;
  }

  navigateToLogin() {
    this.router.navigate(['/login']); // ไปที่หน้า Login
  }

}
