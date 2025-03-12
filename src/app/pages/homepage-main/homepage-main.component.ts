import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ShowPost } from '../../models/showpost_model';
import { UserService } from '../../services/Userservice';
import { PostService } from '../../services/Postservice';
import { ReactPostservice } from '../../services/ReactPostservice';

@Component({
  selector: 'app-homepage-main',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule],
  templateUrl: './homepage-main.component.html',
  styleUrl: './homepage-main.component.scss'
})
export class HomepageMainComponent {
  currentUserId: string | null = null;
   userId: string = '';
   isLiked: boolean = false;
   isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
   posts: ShowPost[] = []; // เก็บโพสต์ทั้งหมด
   isDialogOpen = false; 
 
   constructor(private route: ActivatedRoute, private userService: UserService, private postService: PostService, private likePostService: ReactPostservice, private router: Router,) { }
 
   ngOnInit(): void {
   
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



   onHeartClick() {
    if (!this.isUserLoggedIn()) {  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
      this.openDialog();
    } else {
      // ทำการเพิ่มไลค์หรือดำเนินการอื่น ๆ
      console.log("User has liked the post.");
    }
  }

  isUserLoggedIn(): boolean {
    // ตรวจสอบว่า user เข้าสู่ระบบแล้วหรือยัง (คุณอาจต้องปรับให้เหมาะกับการตรวจสอบสถานะ login ของคุณ)
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

 
}
