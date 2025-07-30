import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AdminService } from '../../services/Admin';
import { UserService } from '../../services/Userservice';
import { User } from '../../models/register_model';
import { ProfileService } from '../../services/Profileservice';
import { Postme } from '../../models/postme_model';
import { ReactPostservice } from '../../services/ReactPostservice';
import { MatButtonModule } from '@angular/material/button';
import { UserBan } from '../../models/ban.model';
import { AdminNotificationService, AdminNotificationCounts } from '../../services/admin-notification.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profileuser-admin',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatIconModule, MatTabsModule, MatButtonModule],
  templateUrl: './profileuser-admin.component.html',
  styleUrl: './profileuser-admin.component.scss'
})
export class ProfileuserAdminComponent implements OnDestroy {

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
  notificationCounts: AdminNotificationCounts = { report: 0, total: 0 };
  private notificationSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute, 
    private userService: UserService, 
    private adminservice: AdminService, 
    private profileService: ProfileService, 
    private reactPostservice: ReactPostservice,
    private router: Router,
    private adminNotificationService: AdminNotificationService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    console.log('=== ProfileUserAdmin ngOnInit ===');
    console.log('localStorage adminId:', localStorage.getItem('adminId'));
    console.log('localStorage adminToken:', localStorage.getItem('adminToken'));
    console.log('sessionStorage adminId:', sessionStorage.getItem('adminId'));
    console.log('sessionStorage adminToken:', sessionStorage.getItem('adminToken'));
    
    this.checkAuthentication();
    
    this.route.queryParams.subscribe(params => {
      this.userId = params['id'];        // ID ของผู้ใช้ที่เลือก
      this.adminId = params['adminId'];  // ID ของแอดมิน

      // แสดงข้อมูล query parameters
      console.log('Query Parameters:', params);
      console.log('User ID (ผู้ใช้ที่เลือก):', this.userId);
      console.log('Admin ID (แอดมิน):', this.adminId);
      
      // ตรวจสอบ error
      if (!params || Object.keys(params).length === 0) {
        console.error('No query parameters received');
        this.errorMessage = 'ไม่ได้รับ query parameters';
        return;
      }

      if (!this.adminId) {
        this.errorMessage = 'Admin ID ไม่พบ กรุณาเข้าสู่ระบบใหม่';
        return;
      }

      if (this.userId) {
        this.followedId = this.userId;
        this.loadUserProfile();
        this.loadUserPosts();
        this.loadFollowCount();
        this.startNotificationTracking();
      } else {
        this.errorMessage = 'ไม่พบ User ID';
        console.log('No User ID found, staying on page to debug');
      }
    });

    this.userService.getUsers().subscribe({
      next: (data) => {
        this.filteredUsers = this.users;
      },
      error: (error) => this.errorMessage = error.message
    });

    this.startNotificationTracking();
  }
 // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.adminId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.adminNotificationService.loadNotificationCounts(this.adminId);
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.adminNotificationService.startAutoUpdate(this.adminId);
      
      // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือน
      this.notificationSubscription = this.adminNotificationService.notificationCounts.subscribe(
        (counts) => {
          this.notificationCounts = counts;
          console.log('Admin notification counts updated:', counts);
        }
      );

      // โหลดข้อมูลการแจ้งเตือนจาก API ที่มีอยู่
      this.loadReportNotifications();
    }
  }

  // โหลดข้อมูลการแจ้งเตือน
  private loadReportNotifications(): void {
    // ใช้ ReactPostservice ที่มีอยู่แล้ว
    const notificationService = new ReactPostservice(this.http);
    notificationService.Noti_Reportaddmin().subscribe({
      next: (data) => {
        const reportCount = data.reports?.length || 0;
        this.notificationCounts = {
          report: reportCount,
          total: reportCount
        };
        console.log('Report notifications loaded:', reportCount);
      },
      error: (err) => {
        console.error('Error loading report notifications:', err);
      }
    });
  }

  // ตรวจสอบการยืนยันตัวตน
  private checkAuthentication(): void {
    console.log('=== checkAuthentication ===');
    // ตรวจสอบ token จากหลายแหล่ง
    const tokenFromLocal = localStorage.getItem('token');
    const tokenFromSession = sessionStorage.getItem('token');
    const adminTokenFromLocal = localStorage.getItem('adminToken');
    const adminTokenFromSession = sessionStorage.getItem('adminToken');
    
    console.log('tokenFromLocal:', tokenFromLocal ? 'exists' : 'null');
    console.log('tokenFromSession:', tokenFromSession ? 'exists' : 'null');
    console.log('adminTokenFromLocal:', adminTokenFromLocal ? 'exists' : 'null');
    console.log('adminTokenFromSession:', adminTokenFromSession ? 'exists' : 'null');
    
    // เลือก token ที่มีอยู่
    const token = tokenFromLocal || tokenFromSession || adminTokenFromLocal || adminTokenFromSession;
    
    if (!token) {
      this.errorMessage = 'Token ไม่พบ กรุณาเข้าสู่ระบบใหม่';
      console.log('No token found');
      return;
    }

    console.log('Token found:', token.substring(0, 20) + '...');
    this.validateToken(token);
  }

  // ตรวจสอบความถูกต้องของ token
  private validateToken(token: string): void {
    try {
      // ตรวจสอบว่า token เป็น JWT format หรือไม่
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid token format');
        this.errorMessage = 'Token format ไม่ถูกต้อง';
        return;
      }

      // ตรวจสอบ expiration time (ถ้ามี)
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > payload.exp) {
          console.log('Token expired');
          this.errorMessage = 'Token หมดอายุ';
          return;
        }
      }

      console.log('Token validation passed');

    } catch (error) {
      console.log('Token validation error:', error);
      this.errorMessage = 'Token validation error';
    }
  }

  loadUserProfile(): void {
    if (this.userId) {
      this.isLoading = true;
      this.errorMessage = '';
      
      console.log('Loading profile for user ID (ผู้ใช้ที่เลือก):', this.userId);
      
      // ใช้ Admin Service
      this.adminservice.getAdminUserProfileById(this.userId).subscribe(
        (data) => {
          this.userProfile = data;
          this.isLoading = false;
          console.log('Profile loaded successfully:', this.userProfile);
        },
        (error) => {
          this.isLoading = false;
          console.error('Error loading profile:', error);
          
          if (error.status === 401) {
            this.errorMessage = 'Admin token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
            console.log('401 Unauthorized error');
          } else if (error.status === 404) {
            this.userProfile = null;
            this.errorMessage = 'ไม่พบข้อมูลผู้ใช้';
            console.log('404 User not found');
          } else {
            this.errorMessage = 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้';
            console.log('Other error:', error);
          }
        }
      );
    }
  }

  loadUserPosts(): void {
    if (this.userId) {
      // ใช้ Admin Service
      this.adminservice.getAdminUserPostsById(this.userId).subscribe(
        (data) => {
          this.userPosts = data.userPosts || data.posts || [];  // โพสต์ของเจ้าของโปรไฟล์
          this.savedPosts = data.savedPosts || [];  // โพสต์ที่บันทึก
          this.sharedPosts = data.sharedPosts || []; // โพสต์ที่แชร์
        },
        (error) => {
          this.errorMessage = 'ไม่สามารถดึงข้อมูลโพสต์ได้';
          if (error.status === 401) {
            this.errorMessage = 'Admin token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
          }
        }
      );
    }
  }

  loadFollowCount(): void {
    if (!this.followedId) return;

    // ใช้ Admin Service
    this.adminservice.getAdminFollowCount(this.followedId).subscribe(
      (response) => {
                  this.followersCount = response.followers || 0;
          this.followingCount = response.following || 0;
      },
      (error) => {
        if (error.status === 401) {
          this.errorMessage = 'Admin token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
        }
      }
    );
  }

  toggleBan(user: any) {
    if (!user?.uid) {
      return;
    }

    if (user.status === 0) {
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.unbanUser(user.uid).subscribe({
          next: (res) => {
            user.status = 1;
          },
          error: (err) => {
            console.error('เกิดข้อผิดพลาด:', err);
          }
        });
      }
    } else {
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.banUser(user.uid, 'ยังไม่ระบุ', '2025-12-31').subscribe({
          next: (res) => {
            user.status = 0;
          },
          error: (err) => {
            console.error('เกิดข้อผิดพลาด:', err);
          }
        });
      }
    }
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

  ngOnDestroy(): void {
    // หยุดการติดตามการแจ้งเตือน
    this.adminNotificationService.stopAutoUpdate();
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}