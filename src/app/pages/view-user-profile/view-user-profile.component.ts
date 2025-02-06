
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { User } from '../../models/register_model'; 
import { ProfileService } from '../../services/Profileservice';

@Component({
  selector: 'app-view-user-profile',
  standalone: true, // ใช้ standalone component
  imports: [  MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,],
  templateUrl: './view-user-profile.component.html',
  styleUrls: ['./view-user-profile.component.scss']
})
export class ViewUserProfileComponent implements OnInit  {

  constructor(private route: ActivatedRoute, private profileService: ProfileService) {}

  userId: string = '';
  isDrawerOpen: boolean = false;
  userProfile: User | null = null;

  ngOnInit(): void {
    // ดึงค่าจาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID:', this.userId);
        this.loadUserProfile(); // เรียกฟังก์ชันโหลดข้อมูลโปรไฟล์
      } else {
        console.warn('User ID not found in query parameters.');
      }
    });
  }

  loadUserProfile(): void {
    if (this.userId) {
      this.profileService.getUserProfileById(this.userId).subscribe(
        (data) => {
          this.userProfile = data;
        },
        (error) => {
          console.error('Error fetching user profile:', error);
          if (error.status === 404) {
            this.userProfile = null; // ไม่พบข้อมูล
          }
        }
      );
    }
  }
  

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; 
  }

}
