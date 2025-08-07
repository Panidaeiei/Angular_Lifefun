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
  standalone: true,
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

    // เพิ่มข้อมูลหมวดหมู่
    categories = [
      { name: 'เครื่องสำอาง', image: 'assets/images/istockphoto.jpg', route: '/Cat_main', id: 1 },
      { name: 'แฟชั่น', image: 'https://i.pinimg.com/736x/c1/51/cd/c151cdffa326596504b10c6bd98a9958.jpg', route: '/Cat_main', id: 2 },
      { name: 'สกินแคร์', image: 'assets/images/skincare.jpg', route: '/Cat_main', id: 3 },
      { name: 'อาหาร', image: 'assets/images/food.jpg', route: '/Cat_main', id: 4 },
      { name: 'สุขภาพ', image: 'assets/images/woman.jpg', route: '/Cat_main', id: 5 },
      { name: 'ท่องเที่ยว', image: 'https://i.pinimg.com/736x/3c/39/7a/3c397a110bed100bf40ccd76ad94c922.jpg', route: '/Cat_main', id: 6 }
    ];

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

   // เพิ่มฟังก์ชันสำหรับนำทางไปยังหมวดหมู่
   goToCategory(route: string, id?: number) {
    if (id) {
      this.router.navigate([route, id]);
    } else {
      this.router.navigate([route]);
    }
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

    // หน้าผู้ใช้งานทั่วไป - ไปหน้า profile โดยไม่ต้องเข้าสู่ระบบ
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
