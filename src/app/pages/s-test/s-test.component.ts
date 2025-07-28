import { Component } from '@angular/core';
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
import { TimeAgoPipe} from '../../pipes/time-ago.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-s-test',
  imports: [MatToolbarModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule, RouterModule, TimeAgoPipe, MatTooltipModule],
  templateUrl: './s-test.component.html',
  styleUrl: './s-test.component.scss'
})
export class STestComponent {

  userId: string = '';
  searchQuery = '';
  allPosts: any[] = [];
  posts: any[] = [];
  loading = false;
  errorMessage = '';
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  showFull: { [key: string]: boolean } = {};
  activeTab: string = 'post';
  isMobile: boolean = false; 

  constructor(private postService: PostService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID set from queryParams:', this.userId);
      } else {
        console.error('User ID not found in queryParams.');
      }
    });

    this.postService.getPosts().subscribe((data: any[]) => {
      // กรองโพสต์ที่ post_id ซ้ำ
      const uniquePosts = data.filter((value, index, self) =>
        index === self.findIndex((t) => t.post_id === value.post_id)
      );
      this.allPosts = uniquePosts;
      this.posts = uniquePosts;
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
        // กรองโพสต์ที่ post_id ซ้ำ
        const uniquePosts = data.filter((value, index, self) =>
          index === self.findIndex((t) => t.post_id === value.post_id)
        );
        this.posts = uniquePosts;
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

  toggleShowFull(postId: string) {
    this.showFull[postId] = !this.showFull[postId];
  }
  
  logout(): void {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUserId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('currentUserId');
    this.router.navigate(['/login']);
  }
}
