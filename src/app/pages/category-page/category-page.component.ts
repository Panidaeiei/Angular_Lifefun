import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-category-page',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule,MatButtonModule,MatCardModule,MatTooltipModule],
  templateUrl: './category-page.component.html',
  styleUrl: './category-page.component.scss'
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  currentUserId: string | null = null;
  userId: string | null = null;
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; 
  cat_id!: number;
  isMobile: boolean = false;

  constructor(private router: ActivatedRoute, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.router.queryParams.subscribe((params: any) => {
      if (params['id']) {
        this.userId = params['id'];
        this.cat_id = +params['cat_id'];
        console.log('User ID set from queryParams:', this.userId);
      } else {
        console.error('User ID not found in queryParams.');
      }
    });
    
    this.checkScreen();
    window.addEventListener('resize', this.checkScreen.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreen.bind(this));
  }

  checkScreen() {
    this.isMobile = window.innerWidth <= 600;
    this.cdr.detectChanges();
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }
}
