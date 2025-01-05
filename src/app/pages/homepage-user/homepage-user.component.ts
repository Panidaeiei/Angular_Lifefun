import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { ShowPost } from '../../models/showpost_model';
import { UserService } from '../../services/service';

@Component({
  selector: 'app-homepage-user',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule,MatButtonModule],
  templateUrl: './homepage-user.component.html',
  styleUrl: './homepage-user.component.scss',
})
export class HomepageUserComponent {
  userId: string = '';
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด

  constructor(private route: ActivatedRoute, private userService: UserService) {}

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

    // ดึงโพสต์จาก Backend
    this.fetchPosts();
  }

  fetchPosts(): void {
    this.userService.getPosts().subscribe(
      (response) => {
        // เพิ่มสถานะ isLiked เริ่มต้นเป็น false ให้กับแต่ละโพสต์
        this.posts = response.map((post) => ({
          ...post,
          isLiked: false,
        }));
        console.log('Fetched posts:', this.posts);
      },
      (error) => {
        console.error('Error fetching posts:', error);
      }
    );
  }
  

  toggleHeart(post: ShowPost): void {
    post.isLiked = !post.isLiked; // เปลี่ยนสถานะ isLiked เฉพาะโพสต์ที่กด
    console.log('Heart icon clicked for post:', post.post_id, 'Liked:', post.isLiked);
  }
  

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  

}
