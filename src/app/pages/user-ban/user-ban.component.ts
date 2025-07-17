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
  selector: 'app-user-ban',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './user-ban.component.html',
  styleUrl: './user-ban.component.scss'
})
export class UserBanComponent {
  [x: string]: any;
  userId: string = '';
  users: User[] = [];
  errorMessage: string = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  filteredUsers: any[] = [];
  searchQuery: string = '';
  isSearchPerformed: boolean = false;


  constructor(private route: ActivatedRoute, private userService: UserService, private adminservice: AdminService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });

    
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filterUsers();

      },
      error: (error) => this.errorMessage = error.message
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
}
