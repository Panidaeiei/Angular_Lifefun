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
import 'leaflet-control-geocoder';
import { Location } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { NotificationService, NotificationCounts } from '../../services/notification.service';
import { Subscription } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';

declare module 'leaflet' {
  namespace Control {
    function geocoder(options?: any): any;
  }
}
declare const google: any;
@Component({
  selector: 'app-create-post',
  standalone: true,
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
    MatSelectModule,
    MatTooltipModule
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
  locationUrl = '';
  lat: number | null = null;
  lon: number | null = null;
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
        // Error handling
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

      // เพิ่มการคลิกบนแผนที่เพื่อปักหมุด
      this.map.addListener('click', (event: any) => {
        this.handleMapClick(event);
      });
    }, 100);
  }

  // ฟังก์ชันจัดการการคลิกบนแผนที่
  handleMapClick(event: any) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    // ลบ marker เดิมถ้ามี
    if (this.mapMarker) {
      this.mapMarker.setMap(null);
    }
    
    // สร้าง marker ใหม่
    // @ts-ignore
    this.mapMarker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      title: 'สถานที่ที่เลือก',
      draggable: true, // ให้สามารถลาก marker ได้
    });
    
    // เพิ่มการลาก marker
    this.mapMarker.addListener('dragend', (event: any) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      this.reverseGeocode(newLat, newLng);
    });
    
    // เรียกใช้ reverse geocoding เพื่อหาชื่อสถานที่
    this.reverseGeocode(lat, lng);
  }

  // ฟังก์ชัน reverse geocoding
  reverseGeocode(lat: number, lng: number) {
    // @ts-ignore
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    
    geocoder.geocode({ location: latlng }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        
        // อัพเดตข้อมูลสถานที่
        this.postData.location = address;
        this.lat = lat;
        this.lon = lng;
        this.locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        
        // อัพเดต marker title
        if (this.mapMarker) {
          this.mapMarker.setTitle(address);
        }
      } else {
        // ใช้พิกัดเป็นชื่อสถานที่
        this.postData.location = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        this.lat = lat;
        this.lon = lng;
        this.locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      }
    });
  }

  copyLocation() {
    if (!this.locationUrl) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.locationUrl)
        .then(() => alert('คัดลอกลิงก์แล้ว'))
        .catch(() => alert('คัดลอกไม่สำเร็จ'));
    } else {
      // fallback เก่าๆ
      const ta = document.createElement('textarea');
      ta.value = this.locationUrl;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        alert('คัดลอกลิงก์แล้ว');
      } catch {
        alert('คัดลอกไม่สำเร็จ');
      } finally {
        document.body.removeChild(ta);
      }
    }
  }


  clearLocation() {
    this.postData.location = '';
    this.locationUrl = '';
    this.lat = null;
    this.lon = null;
  }

  // Mobile location actions
  openMobileLocationMenu() {
    // ใช้ SweetAlert2 สำหรับ mobile menu แบบง่าย
    Swal.fire({
      title: 'จัดการสถานที่',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'เปลี่ยนสถานที่',
      denyButtonText: 'ล้างสถานที่',
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#e28c96',
      denyButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.openMapDialog();
      } else if (result.isDenied) {
        this.clearLocation();
      }
    });
  }

  openLocationInMap() {
    if (this.locationUrl) {
      window.open(this.locationUrl, '_blank');
    }
  }


  closeMapDialog() {
    this.isMapOpen = false;

    if (this.map) {
      this.map = null;
    }
  }

  // ฟังก์ชันยืนยันการเลือกสถานที่
  confirmLocation() {
    if (this.mapMarker && this.postData.location) {
      this.closeMapDialog();
    } else {
      alert('กรุณาเลือกสถานที่ก่อนยืนยัน');
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
    
    this.checkScreenSize();
    
    // โหลด currentUserId จาก localStorage ก่อน
    this.userService.loadCurrentUserId();
    
    // ตรวจสอบ snapshot ครั้งแรก
    const snapshotParams = this.route.snapshot.queryParams;
    if (snapshotParams['id']) {
      this.userId = snapshotParams['id'];
      this.postData.uid = parseInt(this.userId, 10);
      this.loadUserData(this.userId);
      this.startNotificationTracking();
    }
    
    // Subscribe เฉพาะ params ที่มี id เท่านั้น
    this.route.queryParams
      .pipe(filter((params: any) => !!params['id']))
      .subscribe((params: any) => {
        this.userId = params['id'];
        this.postData.uid = parseInt(this.userId, 10);
        this.loadUserData(this.userId);
        this.startNotificationTracking();
      });
    
    // ตรวจสอบ userId ใน url กับ userId ที่ล็อกอิน
    this.userService.getCurrentUserId().subscribe((currentUserId: string | null) => {
      const urlUserId = this.route.snapshot.queryParams['id'];
      
      if (urlUserId && currentUserId && urlUserId !== currentUserId) {
        // ถ้า id ใน url ไม่ตรงกับ id ที่ล็อกอินไว้ ให้ redirect ออก
        this.router.navigate(['/login']);
        return;
      }
    });
  
    this.loadCategories();
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
        
        }
      );
    }
  }

  loadUserData(userId: string): void {
    this.userService.getUserById(userId).subscribe(
      (response) => {
        this.user = response;
      },
      (error) => {
        // Error handling
      }
    );
  }

  loadCategories(): void {
    this.postService.getCategories().subscribe(
      (data: Category[]) => {
        this.categories = data;
      },
      (error) => {
        // Error handling
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

  // ฟังก์ชันสำหรับเปลี่ยนลำดับไฟล์
  moveFile(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.files.length || 
        toIndex < 0 || toIndex >= this.files.length) {
      return;
    }

    const file = this.files.splice(fromIndex, 1)[0];
    this.files.splice(toIndex, 0, file);

    // ปรับ currentIndex ถ้าจำเป็น
    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (this.currentIndex > fromIndex && this.currentIndex <= toIndex) {
      this.currentIndex--;
    } else if (this.currentIndex < fromIndex && this.currentIndex >= toIndex) {
      this.currentIndex++;
    }
  }

  // ฟังก์ชันย้ายไฟล์ไปข้างหน้า
  moveFileForward(index: number): void {
    if (index < this.files.length - 1) {
      this.moveFile(index, index + 1);
    }
  }

  // ฟังก์ชันย้ายไฟล์ไปข้างหลัง
  moveFileBackward(index: number): void {
    if (index > 0) {
      this.moveFile(index, index - 1);
    }
  }

  // ฟังก์ชันย้ายไฟล์ไปตำแหน่งแรก
  moveFileToFirst(index: number): void {
    this.moveFile(index, 0);
  }

  // ฟังก์ชันย้ายไฟล์ไปตำแหน่งสุดท้าย
  moveFileToLast(index: number): void {
    this.moveFile(index, this.files.length - 1);
  }

  // ฟังก์ชันสลับตำแหน่งไฟล์กับไฟล์ถัดไป
  swapWithNext(index: number): void {
    if (index < this.files.length - 1) {
      this.moveFile(index, index + 1);
    }
  }

  // ฟังก์ชันสลับตำแหน่งไฟล์กับไฟล์ก่อนหน้า
  swapWithPrevious(index: number): void {
    if (index > 0) {
      this.moveFile(index, index - 1);
    }
  }

  // ฟังก์ชันย้ายไฟล์ไปตำแหน่งที่กำหนด
  moveFileToPosition(fromIndex: number, toIndex: number): void {
    if (fromIndex >= 0 && fromIndex < this.files.length && 
        toIndex >= 0 && toIndex < this.files.length) {
      this.moveFile(fromIndex, toIndex);
    }
  }

  // ฟังก์ชันแสดงลำดับไฟล์ปัจจุบัน
  getFileOrderInfo(): string {
    return this.files.map((file, index) => 
      `${index + 1}. ${file.type === 'image' ? 'รูปภาพ' : 'วิดีโอ'}`
    ).join(' | ');
  }

  // ฟังก์ชันแสดงข้อมูลไฟล์แต่ละไฟล์
  getFileInfo(index: number): string {
    if (index < 0 || index >= this.files.length) return '';
    const file = this.files[index];
    return `${index + 1}. ${file.type === 'image' ? 'รูปภาพ' : 'วิดีโอ'}`;
  }

  // ฟังก์ชันแสดงข้อมูลไฟล์แบบละเอียด
  getDetailedFileInfo(index: number): string {
    if (index < 0 || index >= this.files.length) return '';
    const file = this.files[index];
    const fileSize = (file.file.size / 1024 / 1024).toFixed(2); // MB
    return `${index + 1}. ${file.type === 'image' ? 'รูปภาพ' : 'วิดีโอ'} (${fileSize} MB)`;
  }

  // ฟังก์ชันแสดงลำดับไฟล์แบบตาราง
  getFileOrderTable(): string {
    return this.files.map((file, index) => {
      const fileSize = (file.file.size / 1024 / 1024).toFixed(2);
      return `${index + 1} | ${file.type === 'image' ? 'รูปภาพ' : 'วิดีโอ'} | ${fileSize} MB`;
    }).join('\n');
  }

  // ฟังก์ชันตรวจสอบว่าไฟล์ปัจจุบันเป็นไฟล์แรกหรือไม่
  isFirstFile(): boolean {
    return this.currentIndex === 0;
  }

  // ฟังก์ชันตรวจสอบว่าไฟล์ปัจจุบันเป็นไฟล์สุดท้ายหรือไม่
  isLastFile(): boolean {
    return this.currentIndex === this.files.length - 1;
  }

  // ฟังก์ชันตรวจสอบว่าลำดับไฟล์ถูกต้องหรือไม่
  isFileOrderCorrect(): boolean {
    // ตรวจสอบว่าวิดีโออยู่ตำแหน่งแรกหรือไม่ (ถ้าผู้ใช้ต้องการ)
    const firstFile = this.files[0];
    return firstFile && firstFile.type === 'video';
  }

  // ฟังก์ชันแสดงคำแนะนำการจัดลำดับ
  getOrderingAdvice(): string {
    if (this.files.length === 0) return 'ไม่มีไฟล์';
    
    const videoCount = this.files.filter(f => f.type === 'video').length;
    const imageCount = this.files.filter(f => f.type === 'image').length;
    
    if (videoCount > 0 && imageCount > 0) {
      return `แนะนำ: จัดวิดีโอให้อยู่ตำแหน่งแรก (${videoCount} วิดีโอ, ${imageCount} รูปภาพ)`;
    } else if (videoCount > 0) {
      return `วิดีโอ ${videoCount} ไฟล์`;
    } else {
      return `รูปภาพ ${imageCount} ไฟล์`;
    }
  }

  // ฟังก์ชันจัดลำดับไฟล์อัตโนมัติ (วิดีโอขึ้นก่อน)
  autoArrangeFiles(): void {
    const videos = this.files.filter(f => f.type === 'video');
    const images = this.files.filter(f => f.type === 'image');
    
    // จัดวิดีโอขึ้นก่อน แล้วตามด้วยรูปภาพ
    this.files = [...videos, ...images];
    this.currentIndex = 0; // รีเซ็ต index กลับไปที่แรก
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
      
      // เก็บไฟล์ที่เลือกมาในลำดับที่ถูกต้อง
      const newFiles: { url: string; file: File; type: 'image' | 'video' }[] = [];
      
      for (const file of filesArray) {
        if (file.type.startsWith('image/')) {
          if (imageCount >= 9) {
            overLimit = true;
            continue;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const newFile = { url: reader.result as string, file, type: 'image' as const };
            newFiles.push(newFile);
            
            // เมื่ออ่านไฟล์เสร็จแล้ว ให้เพิ่มเข้าไปใน this.files ตามลำดับ
            if (newFiles.length === filesArray.length) {
              this.files = [...this.files, ...newFiles];
              console.log('ลำดับไฟล์ที่เลือก:', this.getFileOrderInfo());
            }
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
            const newFile = { url: reader.result as string, file, type: 'video' as const };
            newFiles.push(newFile);
            
            // เมื่ออ่านไฟล์เสร็จแล้ว ให้เพิ่มเข้าไปใน this.files ตามลำดับ
            if (newFiles.length === filesArray.length) {
              this.files = [...this.files, ...newFiles];
              console.log('ลำดับไฟล์ที่เลือก:', this.getFileOrderInfo());
            }
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
    if (
      !this.postData.title.trim() &&
      (!this.postData.cat_id || this.postData.cat_id === 0) &&
      this.files.length === 0
    ) {
      alert('กรุณากรอกข้อมูลเพื่อโพสต์');
      return;
    }

    // ตรวจสอบข้อความโพสต์
    if (!this.postData.title.trim()) {
      alert('กรุณากรอกข้อความโพสต์');
      return;
    }

    // ตรวจสอบหมวดหมู่
    if (!this.postData.cat_id || this.postData.cat_id === 0) {
      alert('กรุณาเลือกหมวดหมู่ก่อนโพสต์');
      return;
    }

    // ตรวจสอบไฟล์
    if (this.files.length === 0) {
      alert('กรุณาเพิ่มรูปภาพหรือวิดีโอก่อนโพสต์');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.postData.title);
    formData.append('location', this.postData.location);
    formData.append('cat_id', this.postData.cat_id.toString());
    formData.append('uid', this.postData.uid.toString());

    // จัดลำดับไฟล์ใน Frontend ก่อนส่งไป Backend
    const orderedFiles = [...this.files]; // สร้าง copy ของ array
    
    // ส่งไฟล์ตามลำดับที่ผู้ใช้เลือก
    orderedFiles.forEach((file, index) => {
      if (file.type === 'image') {
        formData.append('images', file.file);
      } else if (file.type === 'video') {
        formData.append('videos', file.file);
      }
    });

    // เพิ่มข้อมูลลำดับไฟล์ใน comment เพื่อให้ Backend ทราบลำดับ
    const fileOrderInfo = orderedFiles.map((file, index) => ({
      order: index,
      type: file.type,
      fileName: file.file.name
    }));
    formData.append('fileOrderInfo', JSON.stringify(fileOrderInfo));

    // Debug: แสดงลำดับไฟล์ที่จะส่ง
    console.log('ลำดับไฟล์ที่จะส่ง:', this.getFileOrderInfo());
    console.log('จำนวนไฟล์ทั้งหมด:', this.files.length);
    console.log('รายละเอียดไฟล์:', this.files.map((file, index) => ({
      order: index + 1,
      type: file.type,
      fileName: file.file.name,
      fileSize: (file.file.size / 1024 / 1024).toFixed(2) + ' MB'
    })));

    this.isLoading = true; // เปิดสถานะการโหลด

    this.postService.addPost(formData).subscribe(
      (response) => {
        this.isLoading = false; // ปิดสถานะการโหลด
        
        // แสดง SweetAlert2 ที่มินิมอลและสวยงาม
        Swal.fire({
          title: 'โพสต์สำเร็จ',
          text: 'โพสต์ของคุณถูกสร้างเรียบร้อยแล้ว',
          icon: 'success',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#e28c96',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          },
          timer: 2000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end',
          background: '#f8f9fa',
          color: '#333',
          customClass: {
            popup: 'minimal-swal-popup',
            title: 'minimal-swal-title',
            confirmButton: 'minimal-swal-button'
          }
        }).then(() => {
          this.resetForm();
          // ใช้ postID จาก response (ตามที่ backend ส่งกลับมา)
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
              // Error handling
            }
          }
          this.router.navigate(['/detail_post'], { queryParams: { post_id: postId, user_id: this.userId } });
        });
      },
      (error) => {
        this.isLoading = false; // ปิดสถานะการโหลดในกรณีที่เกิดข้อผิดพลาด
        
        // แสดง SweetAlert2 สำหรับ error ที่มินิมอล
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถโพสต์ได้ กรุณาลองใหม่อีกครั้ง',
          icon: 'error',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#dc3545',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          },
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end',
          background: '#fff5f5',
          color: '#dc3545'
        });
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
      
      // สร้าง marker ใหม่
      // @ts-ignore
      this.mapMarker = new google.maps.Marker({
        position: { lat, lng: lon },
        map: this.map,
        title: result.display_name,
        draggable: true, // ให้สามารถลาก marker ได้
      });
      
      // เพิ่มการลาก marker
      this.mapMarker.addListener('dragend', (event: any) => {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        this.reverseGeocode(newLat, newLng);
      });
      
      this.map.setCenter({ lat, lng: lon });
      this.postData.location = result.display_name;
      this.lat = lat;
      this.lon = lon;
      this.locationUrl = `https://www.google.com/maps?q=${lat},${lon}`;
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

      // เก็บไฟล์ที่เลือกมาในลำดับที่ถูกต้อง
      const newFiles: { url: string; file: File; type: 'image' | 'video' }[] = [];

      for (const file of filesArray) {
        if (file.type.startsWith('image/')) {
          if (imageCount >= 9) {
            overLimit = true;
            continue;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const newFile = { url: reader.result as string, file, type: 'image' as const };
            newFiles.push(newFile);
            
            // เมื่ออ่านไฟล์เสร็จแล้ว ให้เพิ่มเข้าไปใน this.files ตามลำดับ
            if (newFiles.length === filesArray.length) {
              this.files = [...this.files, ...newFiles];
              console.log('ลำดับไฟล์ที่เลือก (Drag & Drop):', this.getFileOrderInfo());
            }
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
            const newFile = { url: reader.result as string, file, type: 'video' as const };
            newFiles.push(newFile);
            
            // เมื่ออ่านไฟล์เสร็จแล้ว ให้เพิ่มเข้าไปใน this.files ตามลำดับ
            if (newFiles.length === filesArray.length) {
              this.files = [...this.files, ...newFiles];
              console.log('ลำดับไฟล์ที่เลือก (Drag & Drop):', this.getFileOrderInfo());
            }
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
