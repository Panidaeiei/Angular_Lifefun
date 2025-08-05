import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { SearchUser } from '../../models/search-user.model';
import { UserService } from '../../services/Userservice';

@Component({
  selector: 'app-search-main',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule],
  templateUrl: './search-main.component.html',
  styleUrl: './search-main.component.scss'
})
export class SearchMainComponent {

  searchResults: SearchUser[] = [];
  searchQuery: string = '';
  Profileuser: string = '';
  errorMessage: string = '';
  followedId: string = '';
  followersCount: number = 0;
  isSearchPerformed: boolean = false; // ตรวจสอบว่ามีการค้นหาแล้วหรือไม่
  isLoading: boolean = false; // เพิ่ม loading state

  isMobile = false;
  isDrawerOpen = false;

  constructor(private route: ActivatedRoute,
    private userService: UserService,
    private router: Router) { }

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 600; }

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 600;
  }

  toggleDrawer() { this.isDrawerOpen = !this.isDrawerOpen; }

  onSearch(): void {
    if (this.searchQuery.trim() === '') {
      this.searchResults = [];
      this.isSearchPerformed = false;
      this.errorMessage = '';
      return;
    }

    this.isSearchPerformed = true;
    this.isLoading = true;
    this.errorMessage = '';

    // ตรวจสอบว่ามี token หรือไม่
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      // ถ้ามี token ให้ใช้ method ที่ต้อง authentication
      this.userService.searchUsers(this.searchQuery).subscribe({
        next: (users) => {
          this.searchResults = users;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching users:', error);
          // ถ้า authentication ล้มเหลว ให้ลองใช้ public search
          this.searchUsersPublic();
        },
      });
    } else {
      // ถ้าไม่มี token ให้ใช้ public search
      this.searchUsersPublic();
    }
  }

  private searchUsersPublic(): void {
    this.userService.searchUsersPublic(this.searchQuery).subscribe({
      next: (users) => {
        this.searchResults = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching users (public):', error);
        this.searchResults = [];
        this.isLoading = false;
        this.errorMessage = 'เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง';
      },
    });
  }

  goToProfile(userId: string): void {
    console.log('Navigating to user profile:', userId);

    if (!userId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }

    this.router.navigate(['/viewuser_main'], { queryParams: { Profileuser: userId } });
  }

}
