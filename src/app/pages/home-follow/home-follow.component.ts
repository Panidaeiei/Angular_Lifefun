import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-home-follow',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule,MatButtonModule,MatCardModule ],
  templateUrl: './home-follow.component.html',
  styleUrl: './home-follow.component.scss'
})
export class HomeFollowComponent {
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // ดึงค่าจาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID:', this.userId);
      } else {
        console.error('User ID not found in query parameters.');

      }
    });
  }

  toggleHeart(): void {
    this.isLiked = !this.isLiked; // สลับสถานะ isLiked เมื่อคลิก
    console.log('Heart icon clicked. Liked:', this.isLiked);
  }
  
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }
}
