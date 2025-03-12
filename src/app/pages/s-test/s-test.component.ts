import { Component} from '@angular/core';
import { ShowPost } from '../../models/showpost_model';
import { PostService } from '../../services/Postservice';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router'; 

@Component({
  selector: 'app-s-test',
  imports: [MatToolbarModule,  CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule, RouterModule],
  templateUrl: './s-test.component.html',
  styleUrl: './s-test.component.scss'
})
export class STestComponent {
   
  userId: string = '';
  searchQuery = '';
  posts: ShowPost[] = [];
  loading = false;
  errorMessage = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด

  constructor(private postService: PostService,private router: ActivatedRoute,) {}

  ngOnInit(): void {
    this.router.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID set from queryParams:', this.userId);

      } else {
        console.error('User ID not found in queryParams.');

      }

    });
  }

  onSearch() {
    if (this.searchQuery.trim() === '') {
      this.posts = [];
      return;
    }

    this.loading = true;
    this.postService.searchPosts(this.searchQuery).subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }
}
