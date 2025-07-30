import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { Post } from '../../models/post_model';
import { UserService } from '../../services/Userservice';
import { Category } from '../../models/category_model';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../../models/register_model';
import { PostService } from '../../services/Postservice';
import * as L from 'leaflet';
import 'leaflet-control-geocoder';
import { Location } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { Subscription } from 'rxjs';

declare module 'leaflet' {
  namespace Control {
    function geocoder(options?: any): any;
  }
}
declare const google: any;
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
    MatSelectModule
  ],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss',
})
export class CreatePostComponent implements OnInit, OnDestroy {
  userId: string = '';
  categories: Category[] = []; // Use the Category model
  currentIndex: number = 0; // ดัชนีปัจจุบัน
  files: { url: string; file: File; type: 'image' | 'video' }[] = [];
  fullscreenFile: { url: string; type: 'image' | 'video' } | null = null;
  user: User | null = null;
  isLoading: boolean = false;
  isDrawerOpen: boolean = false; // เริ่มต้น Drawer ปิด
  map: any;
  isMapOpen: boolean = false;
  isMobile = false;
  customSearch: string = '';
  customResults: any[] = [];
  customGeocoderTimeout: any = null;
  placesService: any = null;
  mapMarker: any = null;
  notificationCounts: NotificationCounts = {
    like: 0,
    follow: 0,
    share: 0,
    comment: 0,
    unban: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

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
    private postService: PostService,
    private userService: UserService,  // Inject UserService
    private router: Router,
    private location: Location,
    private notificationService: NotificationService
  ) { }

  openMapDialog() {
    this.isMapOpen = true;

    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Map div ยังไม่ถูกโหลด');
        return;
      }

      if (this.map) {
        this.map.remove();
      }

      // สร้างแผนที่ Google Maps
      // @ts-ignore
      this.map = new google.maps.Map(mapElement, {
        center: { lat: 13.736717, lng: 100.523186 },
        zoom: 13,
      });

      // สร้าง PlacesService
      // @ts-ignore
      this.placesService = new google.maps.places.PlacesService(this.map);
    }, 100);
  }
  

  closeMapDialog() {
    this.isMapOpen = false;

    if (this.map) {
      this.map = null;
    }
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

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
        this.postData.uid = parseInt(this.userId, 10); // อัปเดต uid
        console.log('User ID set from queryParams:', this.userId);
        this.loadUserData(this.userId);
        // เริ่มการติดตามการแจ้งเตือน
        this.startNotificationTracking();
      } else {
        console.error('User ID not found in queryParams.');
        this.router.navigate(['/login']); // เปลี่ยนเส้นทางไปหน้า login หากไม่มี userId
      }
    });

    this.loadCategories();
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  ngOnDestroy(): void {
    // หยุดการติดตามการแจ้งเตือน
    this.notificationService.stopAutoUpdate();
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.notificationService.loadNotificationCounts(Number(this.userId));
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.notificationService.startAutoUpdate(Number(this.userId));
      
      // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือน
      this.notificationSubscription = this.notificationService.notificationCounts$.subscribe(
        (counts) => {
          this.notificationCounts = counts;
          console.log('Notification counts updated:', counts);
        }
      );
    }
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
    this.postService.getCategories().subscribe(
      (data: Category[]) => {
        this.categories = data;
        console.log('Categories loaded:', this.categories);
      },
      (error) => {
        console.error('Error fetching categories:', error);
      }
    );
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

  onTitleChange(value: string): void {
    this.postData.title = value;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      let imageCount = this.files.filter(f => f.type === 'image').length;
      let overLimit = false;
      for (const file of filesArray) {
      if (file.type.startsWith('image/')) {
          if (imageCount >= 9) {
            overLimit = true;
            continue;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.files.push({ url: reader.result as string, file, type: 'image' });
        };
        reader.readAsDataURL(file);
          imageCount++;
      } else if (file.type.startsWith('video/')) {
        if (this.files.some((f) => f.type === 'video')) {
          alert('คุณสามารถเลือกวิดีโอได้เพียง 1 ไฟล์');
            continue;
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
      if (overLimit) {
        alert('คุณสามารถเลือกรูปภาพได้สูงสุด 9 ไฟล์');
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
    console.log('Form Data:', formData);

    this.postService.addPost(formData).subscribe(
      (response) => {
        this.isLoading = false; // ปิดสถานะการโหลด
        console.log('Response from addPost:', response); // เพิ่ม log เพื่อดู response
        Swal.fire({
          title: 'เพิ่มโพสต์สำเร็จ',
          icon: 'success',
        }).then(() => {
          this.resetForm();
          // ใช้ postID จาก response (ตามที่ backend ส่งกลับมา)
          console.log('Full response object:', response); // เพิ่ม debug เพื่อดู response ทั้งหมด
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response));
          
          // ลองเข้าถึง postId ในหลายวิธี
          let postId;
          if (response && typeof response === 'object') {
            postId = response.postId || response.data?.postId || response.post_id || response.insertId || response.id;
          }
          // ถ้ายังไม่ได้ ให้ใช้ JSON.parse
          if (!postId && typeof response === 'string') {
            try {
              const parsedResponse = JSON.parse(response);
              postId = parsedResponse.postId || parsedResponse.post_id || parsedResponse.insertId || parsedResponse.id;
            } catch (e) {
              console.error('Error parsing response:', e);
            }
          }
          console.log('Extracted postId:', postId, 'from response.postId:', response.postId);
          console.log('Navigating to detail_post with postId:', postId, 'userId:', this.userId);
          this.router.navigate(['/detail_post'], { queryParams: { post_id: postId, user_id: this.userId } });
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

  close() {
    this.location.back();
  }

  onCustomInput() {
    // Debounce
    clearTimeout(this.customGeocoderTimeout);
    this.customGeocoderTimeout = setTimeout(() => {
      if (this.customSearch.length > 1) {
        this.fetchCustomGeocode(this.customSearch);
      } else {
        this.customResults = [];
      }
    }, 400);
  }

  onCustomSearch() {
    if (this.customSearch.length > 1) {
      this.fetchCustomGeocode(this.customSearch);
    }
  }

  fetchCustomGeocode(query: string) {
    if (!this.placesService) return;
    const request = {
      query: query,
      fields: ['name', 'geometry', 'formatted_address'],
    };
    // @ts-ignore
    this.placesService.findPlaceFromQuery(request, (results: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        this.customResults = results.map((place: any) => ({
          display_name: place.name + (place.formatted_address ? ' - ' + place.formatted_address : ''),
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng(),
        }));
      } else {
        this.customResults = [];
      }
    });
  }

  selectCustomResult(result: any) {
    // Center map and add marker
    if (this.map) {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      // ลบ marker เดิมถ้ามี
      if (this.mapMarker) {
        this.mapMarker.setMap(null);
      }
      // @ts-ignore
      this.mapMarker = new google.maps.Marker({
        position: { lat, lng: lon },
        map: this.map,
        title: result.display_name,
      });
      this.map.setCenter({ lat, lng: lon });
      this.postData.location = result.display_name;
      this.customResults = [];
      this.customSearch = result.display_name;
      this.closeMapDialog();
    }
  }

  // ฟังก์ชันจัดการ Drag & Drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer?.files) {
      const filesArray = Array.from(event.dataTransfer.files);
      let imageCount = this.files.filter(f => f.type === 'image').length;
      let overLimit = false;
      
      for (const file of filesArray) {
        if (file.type.startsWith('image/')) {
          if (imageCount >= 9) {
            overLimit = true;
            continue;
          }
          const reader = new FileReader();
          reader.onload = () => {
            this.files.push({ url: reader.result as string, file, type: 'image' });
          };
          reader.readAsDataURL(file);
          imageCount++;
        } else if (file.type.startsWith('video/')) {
          if (this.files.some((f) => f.type === 'video')) {
            alert('คุณสามารถเลือกวิดีโอได้เพียง 1 ไฟล์');
            continue;
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
      
      if (overLimit) {
        alert('คุณสามารถเลือกรูปภาพได้สูงสุด 9 ไฟล์');
      }
    }
  }
}
