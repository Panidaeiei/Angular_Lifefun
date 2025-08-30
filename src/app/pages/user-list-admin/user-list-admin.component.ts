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
  usersPerPage = 12;
  currentPage = 1;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private adminservice: AdminService,
    private router: Router,
    private http: HttpClient
  ) {
    // ตรวจสอบ adminId ใน constructor
    const adminId = localStorage.getItem('adminId') || sessionStorage.getItem('adminId');
    if (adminId) {
      this.adminId = adminId;
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

    if (!adminId || !adminToken) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }

    // ตั้งค่า adminId
    this.adminId = adminId;

    // ตรวจสอบอีกครั้งว่า adminId มีค่าหรือไม่
    if (!this.adminId) {
      this.errorMessage = 'ไม่สามารถตั้งค่า Admin ID ได้';
      return;
    }

    this.route.queryParams.subscribe(params => {
      const paramId = params['id'];
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
      this.currentPage = 1;
      return;
    }

    this.isSearchPerformed = true;
    const query = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
    this.currentPage = 1;
  }

  resetSearch(): void {
    this.searchQuery = '';
    this.isSearchPerformed = false;
    this.filteredUsers = this.users.filter(u => u.status !== 0);
    this.currentPage = 1;
  }
  navigateToUserProfile(userId: number): void {

    if (!this.adminId) {
      alert('เกิดข้อผิดพลาด: ไม่พบ Admin ID');
      return;
    }

    if (!userId) {
      alert('เกิดข้อผิดพลาด: ไม่พบ User ID');
      return;
    }

    const params = { id: userId, adminId: this.adminId };

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

  }

  // ลิสต์ที่ใช้งานจริง (ทั้งหมดหรือผลค้นหา)
  get currentList() {
    return this.isSearchPerformed ? this.filteredUsers : this.users;
  }

  get totalPages() {
    return Math.ceil(this.currentList.length / this.usersPerPage) || 1;
  }

  get totalPagesArray() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedUsers() {
    const startIndex = (this.currentPage - 1) * this.usersPerPage;
    return this.currentList.slice(startIndex, startIndex + this.usersPerPage);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  nextPage() { this.goToPage(this.currentPage + 1); }
  prevPage() { this.goToPage(this.currentPage - 1); }

}