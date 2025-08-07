import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services/Userservice';
import { User } from '../../models/register_model';
import { AdminService } from '../../services/Admin';
import { UserBan } from '../../models/ban.model';
import { FormsModule } from '@angular/forms';
import { AdminNotificationService, AdminNotificationCounts } from '../../services/admin-notification.service';
import { Subscription } from 'rxjs';
import { ReactPostservice } from '../../services/ReactPostservice';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-list-admin',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './user-list-admin.component.html',
  styleUrl: './user-list-admin.component.scss'
})
export class UserListAdminComponent implements OnDestroy {
  adminId: string = '';
  users: User[] = [];
  errorMessage: string = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  searchQuery: string = '';
  searchResults: any[] = [];
  isSearchPerformed: boolean = false;
  filteredUsers: any[] = [];
  notificationCounts: AdminNotificationCounts = {
    report: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute, 
    private userService: UserService, 
    private adminservice: AdminService, 
    private router: Router,
    private adminNotificationService: AdminNotificationService,
    private http: HttpClient
  ) { 
    // ตรวจสอบ adminId ใน constructor
    const adminId = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');
    if (adminId) {
      this.adminId = adminId;
      console.log('Constructor: Set adminId to', this.adminId);
    }
  }

  ngOnInit() {
    // ตรวจสอบ adminId และ adminToken จากหลายแหล่ง
    const adminIdFromLocal = localStorage.getItem('adminId');
    const adminIdFromSession = sessionStorage.getItem('adminId');
    const adminTokenFromLocal = localStorage.getItem('adminToken');
    const adminTokenFromSession = sessionStorage.getItem('adminToken');
    
    // เลือกค่าที่มีอยู่
    const adminId = adminIdFromLocal || adminIdFromSession;
    const adminToken = adminTokenFromLocal || adminTokenFromSession;
    
    console.log('AdminId from localStorage:', adminIdFromLocal);
    console.log('AdminId from sessionStorage:', adminIdFromSession);
    console.log('Selected adminId:', adminId);
    
    if (!adminId || !adminToken) {
      console.error('AdminId หรือ AdminToken ไม่พบ');
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    
    // ตั้งค่า adminId
    this.adminId = adminId;
    console.log('Set adminId to:', this.adminId);
    
    // ตรวจสอบอีกครั้งว่า adminId มีค่าหรือไม่
    if (!this.adminId) {
      console.error('Admin ID ยังคงเป็น null!');
      this.errorMessage = 'ไม่สามารถตั้งค่า Admin ID ได้';
      return;
    }
    
    this.route.queryParams.subscribe(params => {
      const paramId = params['id'];
      console.log('Current adminId:', this.adminId);
    });

    this.userService.getUsers().subscribe({
      next: (data) => {
    
        
        this.users = data.filter(user => user.status !== 0);
        this.filteredUsers = this.users;
        
        // ตรวจสอบ user.uid ของแต่ละ user
        this.users.forEach((user, index) => {
          console.log(`User ${index}:`, {
            username: user.username,
            uid: (user as any).uid,
            uidType: typeof (user as any).uid,
            hasUid: (user as any).uid !== undefined && (user as any).uid !== null,
            fullUserObject: user
          });
        });
        
        // ตรวจสอบว่ามี user ที่ไม่มี uid หรือไม่
        const usersWithoutUid = this.users.filter(user => !(user as any).uid);
        if (usersWithoutUid.length > 0) {
          console.warn('Users without UID:', usersWithoutUid);
        }
        
        if (this.users.length === 0) {
          this.errorMessage = 'ไม่พบผู้ใช้งาน';
        } else {
          this.errorMessage = '';
        }
      },
      error: (error) => {
        this.errorMessage = 'Unauthorized';
      }
    });

    // เริ่มการติดตามการแจ้งเตือน
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

  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.isSearchPerformed = false;
      this.filteredUsers = this.users;
      return;
    }

    this.isSearchPerformed = true;
    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.isSearchPerformed = false;
    this.filteredUsers = this.users.filter(user => user.status !== 0);
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
  
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  toggleBanlist(user: UserBan) {
    if (user.uid === undefined || user.uid === null) {
      return;
    }

    if (user.status === 0) {
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.unbanUser(user.uid).subscribe({
          next: (response) => {
            user.status = 1;
            this.filteredUsers = this.users.filter(u => u.status !== 0);
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาด:', error);
          }
        });
      }
    } else {
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.banUser(user.uid, 'ยังไม่ระบุ', '2025-12-31').subscribe({
          next: (response) => {
            user.status = 0;
            this.filteredUsers = this.users.filter(u => u.status !== 0);
            // ไปที่หน้า userban ทันที
            this.router.navigate(['/userban'], { queryParams: { id: user.uid } });
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาด:', error);
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