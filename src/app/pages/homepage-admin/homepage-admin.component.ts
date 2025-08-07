import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { PostService } from '../../services/Postservice';
import { ShowPost } from '../../models/showpost_model';

@Component({
  selector: 'app-homepage-admin',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule],
  templateUrl: './homepage-admin.component.html',
  styleUrl: './homepage-admin.component.scss'
})
export class HomepageAdminComponent {
  userId: string = '';
  isDrawerOpen: boolean = false; 
  posts: ShowPost[] = [];

  constructor(private route: ActivatedRoute, private postService: PostService, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });

    this.fetchPosts();
  }

    fetchPosts(): void {
      this.postService.getPosts().subscribe(
        (response: ShowPost[]) => {
          console.log('Response from API:', response);  // ตรวจสอบข้อมูลที่ได้รับจาก API
  
          // กรองโพสต์ที่มี `post_id` ซ้ำ
          const uniquePosts = response.filter((value, index, self) =>
            index === self.findIndex((t) => (
              t.post_id === value.post_id
            ))
          );
  
          console.log('Unique Posts:', uniquePosts); // ตรวจสอบโพสต์ที่กรองออกมา
  
          // อัปเดตค่า posts ที่กรองแล้ว
          this.posts = uniquePosts;
  
          // เพียงแค่ใช้ค่าของ hasMultipleMedia ที่มาจาก API
          this.posts.forEach(post => {
            console.log('Has Multiple Media:', post.hasMultipleMedia);  // ตรวจสอบสถานะ hasMultipleMedia
          });
        },
        (error) => {
          console.error('Error fetching posts:', error);
        }
      );
    }
  
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  logout() {
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
