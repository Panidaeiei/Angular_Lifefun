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
import { TimeAgoPipe} from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-searctpost-main',
  imports: [RouterModule, MatToolbarModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, FormsModule,TimeAgoPipe],
  templateUrl: './searctpost-main.component.html',
  styleUrl: './searctpost-main.component.scss'
})
export class SearctpostMainComponent implements OnInit {

  constructor(private router : Router,private postService: PostService) {
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
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.allPosts = data;
        this.posts = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (this.searchQuery.trim() === '') {
      this.posts = this.allPosts;
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
