import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { PostService } from '../../services/Postservice';

@Component({
  selector: 'app-category-main',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule,MatButtonModule,MatCardModule],
  templateUrl: './category-main.component.html',
  styleUrl: './category-main.component.scss'
})
export class CategoryMainComponent {
  posts: any[] = [];
  viewPosts: any[] = [];
  isDialogOpen = false;
  catMap: { [key: number]: string } = {
    1: 'เครื่องสำอาง',
    2: 'แฟชั่น',
    3: 'สกินแคร์',
    4: 'อาหาร',
    5: 'สุภาพ',
    6: 'ท่องเที่ยว'
  };
  categoryName: string = '';

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const catId = Number(this.route.snapshot.paramMap.get('cat_id'));

    this.categoryName = this.catMap[catId] || 'ไม่พบหมวดหมู่';
    this.postService.getPostsByCategory(catId).subscribe({
      next: (data) => this.posts = data,
      error: (err) => console.error(err)
    });

    this.postService.getViewCounts().subscribe({
      next: (data) => {
        this.viewPosts = data;
        console.log('View Data:', data);
      },
      error: (err) => {
        console.error('Error loading views:', err);
      }
    });
  }
  getViewsForPost(postId: string): number {
    const postIdString = postId.toString();

    // ค้นหาข้อมูลใน viewPosts โดยเปรียบเทียบ post_id
    const view = this.viewPosts.find(v => v.post_id.toString() === postIdString);

    // console.log('View Post ID:', postId, 'View Data:', view); 

    return view?.total_views ? parseInt(view.total_views) : 0;
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

}
