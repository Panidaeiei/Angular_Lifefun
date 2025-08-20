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
import { MatTooltipModule } from '@angular/material/tooltip';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-viewuser-main',
  standalone: true,
  imports: [MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,],
  templateUrl: './viewuser-main.component.html',
  styleUrl: './viewuser-main.component.scss'
})
export class ViewuserMainComponent {

  constructor(private route: ActivatedRoute, private profileService: ProfileService, private reactPostservice: ReactPostservice, private router: Router) { }

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
  isMobile = false;
  isLoading: boolean = false; // เพิ่ม loading state
  isMockData: boolean = false; // เพิ่ม flag สำหรับ mock data


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const profileUserId = params['Profileuser'];
      if (profileUserId) {
        this.Profileuser = profileUserId;
        this.followedId = profileUserId;
        this.isLoading = true;
        this.errorMessage = '';
        this.loadUserProfile();
        this.loadUserPosts();
        this.loadFollowCount();
      }
    });
    this.isMobile = window.innerWidth <= 600;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth <= 600;
  }

  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  loadUserProfile(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
    if (token) {
      this.profileService.getUserProfileById(this.Profileuser).subscribe(
        (data) => {
          this.userProfile = data;
          this.isLoading = false; // เพิ่มกลับมา
        },
        (error) => {
          console.error('Error fetching owner profile:', error);
          if (error.status === 404) {
            this.userProfile = null;
            this.isLoading = false; // เพิ่มกลับมา
          } else if (error.status === 401) {
            this.loadUserProfilePublic();
          } else {
            this.isLoading = false; // เพิ่มกลับมา
          }
        }
      );
    } else {
      this.loadUserProfilePublic();
    }
  }


  private loadUserProfilePublic(): void {
    this.profileService.getUserProfileByIdPublic(this.Profileuser).subscribe(
      (data) => {
        this.userProfile = data;
        this.isLoading = false;
        // ตรวจสอบว่าเป็น mock data หรือไม่
        if (data.description && data.description.includes('public profile view')) {
          this.isMockData = true;
        }
      },
      (error) => {
        console.error('Error fetching owner profile (public):', error);
        if (error.status === 404) {
          this.userProfile = null;
          this.errorMessage = 'ไม่พบข้อมูลผู้ใช้นี้';
        } else {
          this.errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์';
        }
        this.isLoading = false;
      }
    );
  }

  loadUserPosts(): void {
    if (this.Profileuser) {
    
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token) {
        // ถ้ามี token ให้ใช้ method ที่ต้อง authentication
        this.profileService.getUserPostsById(this.Profileuser).subscribe(
          (data) => {
            this.userPosts = data.userPosts;
            this.savedPosts = data.savedPosts;
            this.sharedPosts = data.sharedPosts;
          },
          (error) => {
            console.error('Error fetching posts:', error);
            if (error.status === 401) {
              // ถ้า authentication ล้มเหลว ให้ลองใช้ public method
              this.loadUserPostsPublic();
            } else {
              this.errorMessage = 'ไม่สามารถดึงข้อมูลโพสต์ได้';
            }
          }
        );
      } else {
        // ถ้าไม่มี token ให้ใช้ public method
        this.loadUserPostsPublic();
      }
    }
  }

  private loadUserPostsPublic(): void {
    this.profileService.getUserPostsByIdPublic(this.Profileuser).subscribe(
      (data) => {
        this.userPosts = data.userPosts;
        this.savedPosts = data.savedPosts;
        this.sharedPosts = data.sharedPosts;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching posts (public):', error);
        this.errorMessage = 'ไม่สามารถดึงข้อมูลโพสต์ได้';
        this.isLoading = false;
      }
    );
  }

  loadFollowCount(): void {
    if (!this.followedId) return;

    // ลองโหลดข้อมูลจาก localStorage ก่อน
    const storedFollowCount = localStorage.getItem(`followCount_${this.followedId}`);
    if (storedFollowCount) {
      try {
        const parsed = JSON.parse(storedFollowCount);
        this.followersCount = parsed.followers || 0;
        this.followingCount = parsed.following || 0;
        console.log('Loaded follow count from storage:', { followers: this.followersCount, following: this.followingCount });
      } catch (error) {
        console.error('Error parsing stored follow count:', error);
      }
    }

    // ตรวจสอบว่ามี token หรือไม่
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (token) {
      // ถ้ามี token ให้ใช้ ReactPostservice.getFollowCount() ที่มีอยู่จริง
      this.reactPostservice.getFollowCount(this.followedId).subscribe(
        (response) => {
          console.log('Follow count response:', response);
          if (response && response.followers !== undefined && response.following !== undefined) {
            this.followersCount = response.followers;
            this.followingCount = response.following;
            
            // บันทึกลง localStorage
            const followData = { followers: this.followersCount, following: this.followingCount };
            localStorage.setItem(`followCount_${this.followedId}`, JSON.stringify(followData));
            console.log('Saved follow count to storage:', followData);
          } else {
            console.warn('Invalid follow count response format:', response);
            // ใช้ค่าจาก localStorage ถ้ามี
            if (storedFollowCount) {
              try {
                const parsed = JSON.parse(storedFollowCount);
                this.followersCount = parsed.followers || 0;
                this.followingCount = parsed.following || 0;
              } catch (error) {
                this.followersCount = 0;
                this.followingCount = 0;
              }
            }
          }
        },
        (error) => {
          console.error('Error fetching follow count from API:', error);
          
          // ถ้าไม่มีข้อมูลใน localStorage ให้ใช้ค่าเริ่มต้น
          if (!storedFollowCount) {
            this.followersCount = 0;
            this.followingCount = 0;
          }
          
          console.warn('ไม่สามารถโหลดข้อมูลผู้ติดตามได้ ใช้ข้อมูลจาก cache หรือค่าเริ่มต้น');
        }
      );
    } else {
      // ถ้าไม่มี token ให้ใช้ ReactPostservice.getFollowCountPublic() แต่จัดการ error
      this.reactPostservice.getFollowCountPublic(this.followedId).subscribe(
        (response) => {
          console.log('Public follow count response:', response);
          if (response && response.followers !== undefined && response.following !== undefined) {
            this.followersCount = response.followers;
            this.followingCount = response.following;
            
            // บันทึกลง localStorage
            const followData = { followers: this.followersCount, following: this.followingCount };
            localStorage.setItem(`followCount_${this.followedId}`, JSON.stringify(followData));
            console.log('Saved public follow count to storage:', followData);
          } else {
            console.warn('Invalid public follow count response format:', response);
            // ใช้ค่าจาก localStorage ถ้ามี
            if (storedFollowCount) {
              try {
                const parsed = JSON.parse(storedFollowCount);
                this.followersCount = parsed.followers || 0;
                this.followingCount = parsed.following || 0;
              } catch (error) {
                this.followersCount = 0;
                this.followingCount = 0;
              }
            }
          }
        },
        (error) => {
          console.error('Error fetching public follow count:', error);
          
          // ถ้าไม่มีข้อมูลใน localStorage ให้ใช้ค่าเริ่มต้น
          if (!storedFollowCount) {
            this.followersCount = 0;
            this.followingCount = 0;
          }
          
          console.warn('ไม่สามารถโหลดข้อมูลผู้ติดตามได้ ใช้ข้อมูลจาก cache หรือค่าเริ่มต้น');
        }
      );
    }
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
