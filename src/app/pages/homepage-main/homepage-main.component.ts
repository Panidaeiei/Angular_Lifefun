import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ShowPost } from '../../models/showpost_model';
import { PostService } from '../../services/Postservice';
import { UserService } from '../../services/Userservice';
import { SearchUser } from '../../models/search-user.model';
import { MatIconModule } from '@angular/material/icon';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';


@Component({
  selector: 'app-homepage-main',
  imports: [MatToolbarModule,
        RouterModule,
        CommonModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        TimeAgoPipe],
  templateUrl: './homepage-main.component.html',
  styleUrl: './homepage-main.component.scss'
})
export class HomepageMainComponent {
  userId: string = '';
  currentUserId: string | null = null;
  isLiked: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด
  isDialogOpen = false;
  userResults: SearchUser[] = [];
  searchQuery: string = '';
  isMobile = false;


  constructor(private postService: PostService, private router: Router) { }

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 600; }

  ngOnInit(): void {
    this.fetchPosts();
    this.isMobile = window.innerWidth <= 600;
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

  onHeartClick() {
    if (!this.isUserLoggedIn()) {  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
      this.openDialog();
    } else {
      console.log("User has liked the post.");
    }
  }

  isUserLoggedIn(): boolean {
    return false; // สมมุติว่า user ยังไม่ได้เข้าสู่ระบบ
  }

  openDialog() {
    this.isDialogOpen = true;
  }

  closeDialog() {
    this.isDialogOpen = false;
  }

  navigateToLogin() {
    this.router.navigate(['/login']); // ไปที่หน้า Login
  }

  goToProfile(userId: string): void {
    console.log('Navigating to user profile:', userId);

    if (!userId) {
      console.error('User ID is missing! Navigation aborted.');
      return;
    }

    this.router.navigate(['/viewuser_main'], { queryParams: { Profileuser: userId } });
  }

    viewPost(postId: string): void {
    this.postService.viewPost(postId).subscribe({
      next: () => {
        // เมื่อ API viewPost สำเร็จแล้ว ค่อยเปลี่ยนหน้า
        this.router.navigate(['/detail_postmain'], { queryParams: { post_id: postId} });
      },
      error: (err) => console.error('Error updating view count:', err)
    });
  }

  toggleDrawer() { this.isDrawerOpen = !this.isDrawerOpen; }

}
