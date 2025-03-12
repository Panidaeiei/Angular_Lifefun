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
@Component({
  selector: 'app-user-list-admin',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule],
  templateUrl: './user-list-admin.component.html',
  styleUrl: './user-list-admin.component.scss'
})
export class UserListAdminComponent {
  [x: string]: any;
  userId: string = '';
  users: User[] = [];
  errorMessage: string = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด

  constructor(private route: ActivatedRoute,private userService: UserService,private adminservice: AdminService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });
  
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        // ตรวจสอบว่าแต่ละ user มี id หรือไม่
    
      },
      error: (error) => this.errorMessage = error.message
    });
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
      if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการระงับบัญชีของ ${user.username}`)) {
        this.adminservice.unbanUser(user.uid).subscribe({
          next: (response) => {
            user.status = 1;  // เปลี่ยนสถานะผู้ใช้เป็นปกติ
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
            user.status = 0;  // เปลี่ยนสถานะผู้ใช้เป็นระงับ
            console.log('บัญชีผู้ใช้ถูกระงับ:', response);
          },
          error: (error) => {
            console.error('เกิดข้อผิดพลาด:', error);
          }
        });
      }
    }
  }
  
}
