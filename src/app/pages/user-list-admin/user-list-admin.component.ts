import { Component } from '@angular/core';
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
@Component({
  selector: 'app-user-list-admin',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './user-list-admin.component.html',
  styleUrl: './user-list-admin.component.scss'
})
export class UserListAdminComponent {
  [x: string]: any;
  userId: string = '';
  users: User[] = [];
  errorMessage: string = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  searchQuery: string = '';
  searchResults: any[] = [];
  isSearchPerformed: boolean = false;
  filteredUsers: any[] = [];

  constructor(private route: ActivatedRoute, private userService: UserService, private adminservice: AdminService, private router: Router) { }

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
        this.users = data.filter(user => user.status !== 0);
        this.filteredUsers = this.users;
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
    this.filteredUsers = this.users.filter(user => user.status !== 0); // โหลดผู้ใช้ที่ไม่ถูกระงับอีกครั้ง
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  toggleBanlist(user: UserBan) {
    if (user.uid === undefined || user.uid === null) {
      console.error('User ID is missing');
      return;
    }

    if (user.status === 0) {
      // แจ้งเตือนก่อนยกเลิกการระงับบัญชี
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.unbanUser(user.uid).subscribe({
          next: (response) => {
            user.status = 1;  // เปลี่ยนสถานะผู้ใช้เป็นปกติ
            this.filteredUsers = this.users.filter(u => u.status !== 0);
            console.log('ยกเลิกการระงับบัญชี:', response);
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาด:', error);
          }
        });
      }
    } else {
      // แจ้งเตือนก่อนทำการระงับบัญชี
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการระงับบัญชีของ ${user.username}?`)) {
        this.adminservice.banUser(user.uid, 'โพสต์เนื้อหาที่ไม่เหมาะสม', '2025-12-31').subscribe({
          next: (response) => {
            user.status = 0;  // เปลี่ยนสถานะผู้ใช้เป็นระงับ
            this.filteredUsers = this.users.filter(u => u.status !== 0);
            console.log('บัญชีผู้ใช้ถูกระงับ:', response);
            // นำทางไปหน้า userban พร้อมส่ง id (adminId)
            const adminId = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');
            this.router.navigate(['/userban'], { queryParams: { id: adminId } });
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
}