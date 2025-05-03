import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-category-page',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule,MatButtonModule,MatCardModule],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent {
  currentUserId: string | null = null;
   userId: string | null = null;
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; 

  constructor(private router: ActivatedRoute,) { }

  ngOnInit(): void {
    this.router.queryParams.subscribe((params: any) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID set from queryParams:', this.userId);
      } else {
        console.error('User ID not found in queryParams.');
      }
    });
    
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }
}
