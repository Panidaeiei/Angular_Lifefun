import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Post } from '../../models/post_model';
import { UserService } from '../../services/service';
import { Category } from '../../models/category_model';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../../models/register_model';

@Component({
  selector: 'app-create-post',
  imports: [
    MatToolbarModule,
    RouterModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatChipsModule,
    MatMenuModule,
    MatButtonModule,
  ],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss',
})
export class CreatePostComponent {
  userId: string = '';
  categories: Category[] = []; // Use the Category model
  currentIndex: number = 0; // ดัชนีปัจจุบัน
  files: { url: string; file: File; type: 'image' | 'video' }[] = [];
  fullscreenFile: { url: string; type: 'image' | 'video' } | null = null;
  user: User | null = null; 
  isLoading: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด

  postData: Post = {
    title: '',
    location: '',
    cat_id: 0,
    uid: 0,
    imageUrls: [],
    videoUrls: [],
  };

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        this.postData.uid = parseInt(this.userId, 10); // อัปเดต uid
        console.log('User ID set from queryParams:', this.userId);
        this.loadUserData(this.userId);
      } else {
        console.error('User ID not found in queryParams.');
        this.router.navigate(['/login']); // เปลี่ยนเส้นทางไปหน้า login หากไม่มี userId
      }
    });
    this.loadCategories();
  }
  
  loadUserData(userId: string): void {
    this.userService.getUserById(userId).subscribe(
      (response) => {
        console.log('API Response:', response);
        console.log(this.user?.image_url);
        console.log('User data loaded:', response);
        this.user = response;
      },
      (error) => {
        console.error('Error fetching user data:', error);
      }
    );
  }
  
  loadCategories(): void {
    this.userService.getCategories().subscribe(
      (data: Category[]) => {
        this.categories = data;
        console.log('Categories loaded:', this.categories);
      },
      (error) => {
        console.error('Error fetching categories:', error);
      }
    );
  }


  onTitleChange(value: string): void {
    this.postData.title = value;
  }

  setCategory(cat_id: number): void {
    this.postData.cat_id = cat_id;
  }

  getCategoryName(cat_id: number): string {
    const category = this.categories.find((cat) => cat.cat_id === cat_id);
    return category ? category.name : 'เลือกหมวดหมู่';
  }

  get currentFile() {
    return this.files[this.currentIndex];
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        if (this.files.filter((f) => f.type === 'image').length >= 10) {
          alert('คุณสามารถเลือกรูปภาพได้สูงสุด 10 ไฟล์');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.files.push({ url: reader.result as string, file, type: 'image' });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        if (this.files.some((f) => f.type === 'video')) {
          alert('คุณสามารถเลือกวิดีโอได้เพียง 1 ไฟล์');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.files.push({ url: reader.result as string, file, type: 'video' });
        };
        reader.readAsDataURL(file);
      } else {
        alert('โปรดเลือกไฟล์ที่เป็นรูปภาพหรือวิดีโอ');
      }
    }

    input.value = '';
  }

  previousFile(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  nextFile(): void {
    if (this.currentIndex < this.files.length - 1) {
      this.currentIndex++;
    }
  }
  
  submitPost(): void {
    if (!this.postData.title || !this.postData.cat_id) {
      Swal.fire('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
  
    const formData = new FormData();
    formData.append('title', this.postData.title);
    formData.append('location', this.postData.location);
    formData.append('cat_id', this.postData.cat_id.toString());
    formData.append('uid', this.postData.uid.toString());
  
    this.files.forEach(file => {
      if (file.type === 'image') {
        formData.append('images', file.file);
      } else if (file.type === 'video') {
        formData.append('videos', file.file);
      }
    });
  
    this.isLoading = true; // เปิดสถานะการโหลด
    console.log('Request Body:', this.postData);
    console.log('Files:', this.files);
  
    this.userService.addPost(formData).subscribe(
      (response) => {
        this.isLoading = false; // ปิดสถานะการโหลด
        Swal.fire({
          title: 'เพิ่มโพสต์สำเร็จ',
          icon: 'success',
        }).then(() => {
          this.resetForm();
          this.router.navigate(['/HomepageUser'], { queryParams: { id: this.userId } });
        });
      },
      (error) => {
        this.isLoading = false; // ปิดสถานะการโหลดในกรณีที่เกิดข้อผิดพลาด
        console.error('Error adding post:', error);
      }
    );
  }

  
  resetForm(): void {
    this.postData = {
      title: '',
      location: '',
      cat_id: 0,
      uid: parseInt(this.userId, 10),
      imageUrls: [],
      videoUrls: [],
    };
    this.files = [];
    this.currentIndex = 0;
  }

  confirmRemoveFile(): void {
    if (this.currentFile?.type === 'image') {
      const confirmation = confirm('คุณต้องการลบรูปภาพนี้หรือไม่?');
      if (confirmation) {
        this.removeCurrentFile();
      }
    } else if (this.currentFile?.type === 'video') {
      const confirmation = confirm('คุณต้องการลบวิดีโอนี้หรือไม่?');
      if (confirmation) {
        this.removeCurrentFile();
      }
    }
  }

  removeCurrentFile(): void {
    if (this.currentFile) {
      this.files.splice(this.currentIndex, 1);

      if (this.files.length === 0) {
        this.currentIndex = 0;
      } else if (this.currentIndex >= this.files.length) {
        this.currentIndex = this.files.length - 1;
      }
    }
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
