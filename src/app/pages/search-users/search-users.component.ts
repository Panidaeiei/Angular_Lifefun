import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../services/Userservice';
import { SearchUser } from '../../models/search-user.model';
import { FormsModule } from '@angular/forms';
import { Postme } from '../../models/postme_model';


@Component({
  selector: 'app-search-users',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './search-users.component.html',
  styleUrl: './search-users.component.scss'
})
export class SearchUsersComponent {

  userId: string = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  searchResults: SearchUser[] = [];
  searchQuery: string = '';
  Profileuser: string = '';
  userPosts: Postme[] = [];
  errorMessage: string = '';
  followedId: string = '';  // ID ของผู้ใช้ที่คุณต้องการติดตามหรือเลิกติดตาม
  followersCount: number = 0;
  currentUserId: string | null = null;
  isSearchPerformed: boolean = false; // ตรวจสอบว่ามีการค้นหาแล้วหรือไม่


  constructor(
    private routeron: ActivatedRoute,
    private userService: UserService,  // Inject UserService
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.routeron.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID set from queryParams:', this.userId);

        this.Profileuser = this.userId;  // กำหนด Profileuser เป็น userId
        this.followedId = this.userId;  // กำหนด followedId เป็น userId

        console.log('Followed ID set:', this.followedId);  // ตรวจสอบค่าใน Console

      } else {
        console.error('User ID not found in queryParams.');
        this.router.navigate(['/login']); // ถ้าไม่มี userId ให้ไปหน้า login
      }

      this.userService.getCurrentUserId().subscribe((userId) => {
        this.currentUserId = userId;
      });
      this.userService.loadCurrentUserId();


    });
  }


  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.searchResults = [];
      this.isSearchPerformed = false; 
      return;
    }

    this.isSearchPerformed = true;

    this.userService.searchUsers(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
      },
      error: (error) => {
        console.error('Error searching users:', error);
      },
    });
  }


  goToProfile(userId: string): void {
    console.log('Current User ID:', this.currentUserId);
    console.log('Navigating to:', userId);
    console.log('Query Params ID:', this.userId);
  
    if (!userId || !this.currentUserId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }

    if (String(userId) === String(this.userId)) {
      // หาก userId คือ currentUserId, ไปที่หน้าประวัติของผู้ใช้ (ProfileUser)
      this.router.navigate(['/ProfileUser'], { queryParams: { id: userId } });
    } else {
      // หาก userId ไม่เหมือน currentUserId, ไปที่หน้าผู้ใช้ที่กำลังดู (view_user) พร้อม queryParams สำหรับ viewerId
      this.router.navigate(['/view_user', this.currentUserId], { queryParams: { Profileuser: userId } });
    }
  }


}
