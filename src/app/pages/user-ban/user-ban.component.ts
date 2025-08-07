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
  selector: 'app-user-ban',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './user-ban.component.html',
  styleUrl: './user-ban.component.scss'
})
export class UserBanComponent implements OnDestroy {
  userId: string = '';
  users: User[] = [];
  errorMessage: string = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  filteredUsers: any[] = [];
  searchQuery: string = '';
  isSearchPerformed: boolean = false;
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
  ) { }

  ngOnInit() {
    const adminId = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (!adminId || !adminToken) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });

    
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filterUsers();
        if (this.filteredUsers.length === 0) {
          this.errorMessage = 'ไม่พบผู้ใช้งานที่ถูกระงับ';
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
    if (this.userId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.adminNotificationService.loadNotificationCounts(this.userId);
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.adminNotificationService.startAutoUpdate(this.userId);
      
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
    const notificationService = new ReactPostservice(this.http);
    notificationService.Noti_Reportaddmin().subscribe({
      next: (data: any) => {
        const reportCount = data.reports?.length || 0;
        this.notificationCounts = {
          report: reportCount,
          total: reportCount
        };
        console.log('Report notifications loaded:', reportCount);
      },
      error: (err: any) => {
        console.error('Error loading report notifications:', err);
      }
    });
  }

  filterUsers(): void {
    // กรองเฉพาะ user ที่ถูกแบน
    this.filteredUsers = this.users.filter(user => user.status === 0);
  }

  onSearchBannedUsers(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (query === '') {
      this.filterUsers(); // ถ้าช่องค้นหาว่างให้แสดงผู้ถูกระงับทั้งหมด
      return;
    }
    // กรองจาก username หรือ email ของ user ที่ถูกแบน
    this.filteredUsers = this.users.filter(user =>
      user.status === 0 && (
        user.username.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query))
      )
    );
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  toggleBan(user: UserBan) {
    if (user.uid === undefined || user.uid === null) {
      console.error('User ID is missing');
      return;
    }

    if (user.status === 0) {
      // แจ้งเตือนก่อนยกเลิกการระงับบัญชี
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการระงับบัญชีของ ${user.username}?`)) {
        this.adminservice.unbanUser(user.uid).subscribe({
          next: (response) => {
            user.status = 1; // เปลี่ยนสถานะเป็นปกติ
            this.filterUsers(); // อัปเดต filteredUsers หลังจากเปลี่ยนสถานะ
            console.log('ยกเลิกการระงับบัญชี:', response);
            // แจ้งเตือนความสำเร็จและ redirect
            import('sweetalert2').then(Swal => {
              Swal.default.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: 'ยกเลิกการระงับบัญชีเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false
              }).then(() => {
                this.router.navigate(['/userlist'], { queryParams: { id: this.userId } });
              });
            });
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาด:', error);
          }
        });
      }
    } else {
      // แจ้งเตือนก่อนทำการระงับบัญชี
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชีของ ${user.username}?`)) {
        this.adminservice.banUser(user.uid, 'ยังไม่ระบุ', '2025-12-31').subscribe({
          next: (response) => {
            user.status = 0; // เปลี่ยนสถานะเป็นระงับ
            this.filterUsers(); // อัปเดต filteredUsers หลังจากเปลี่ยนสถานะ
            console.log('บัญชีผู้ใช้ถูกระงับ:', response);
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาด:', error);
          }
        });
      }
    }
  }

  // Getter สำหรับ template เพื่อแสดงเฉพาะผู้ใช้ที่ถูกระงับ
  get filteredBannedUsers() {
    return this.filteredUsers ? this.filteredUsers.filter((user: any) => user.status === 0) : [];
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
