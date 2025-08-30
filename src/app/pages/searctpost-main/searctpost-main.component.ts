import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../services/Postservice';
import { ShowPost } from '../../models/showpost_model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-searctpost-main',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule, TimeAgoPipe],
  templateUrl: './searctpost-main.component.html',
  styleUrl: './searctpost-main.component.scss'
})
export class SearctpostMainComponent implements OnInit {

  constructor(private router: Router, private postService: PostService) {
    this.checkScreenSize();
  }

  posts: ShowPost[] = [];
  searchQuery = '';
  errorMessage = '';
  loading = false;
  isDialogOpen = false;
  isMobile = false;
  isDrawerOpen = false;
  showFull: { [postId: string]: boolean } = {};
  allPosts: ShowPost[] = [];
  postsLoaded = false; // เพิ่มตัวแปรนี้
  
  // เพิ่ม debounced search
  private searchSubject = new Subject<string>();

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  toggleDrawer() {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  showFullTitle(post: ShowPost) {
    // แสดงข้อความเต็มใน alert หรือ modal
    alert(post.title);
  }

  ngOnInit() {
    // ไม่โหลดโพสต์ทันที - รอให้ user ค้นหา
    this.setupDebouncedSearch();
  }

  // เพิ่มฟังก์ชันตั้งค่า debounced search
  private setupDebouncedSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300), // รอ 300ms หลังหยุดพิมพ์
      distinctUntilChanged() // เรียกเฉพาะเมื่อ query เปลี่ยน
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  // แยกฟังก์ชันการค้นหาจริง
  private performSearch(query: string): void {
    if (query.trim() === '') {
      this.posts = [];
      this.postsLoaded = false;
      return;
    }

    this.loading = true;
    this.postService.searchPosts(query).subscribe({
      next: (data) => {
        // กรองโพสต์ที่ post_id ซ้ำ
        const uniquePosts = data.filter((value, index, self) =>
          index === self.findIndex((t) => t.post_id === value.post_id)
        );
        this.posts = uniquePosts;
        this.postsLoaded = true;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  onSearch() {
    // ค้นหาทันทีเมื่อกดปุ่มค้นหาหรือกด Enter
    this.searchSubject.next(this.searchQuery);
  }

  onloginClick(): void {
    if (!this.isUserLoggedIn()) {  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
      this.openDialog();
    } else {
      // ทำการเพิ่มไลค์หรือดำเนินการอื่น ๆ
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

  toggleShowFull(postId: string) {
    this.showFull[postId] = !this.showFull[postId];
  }

}
