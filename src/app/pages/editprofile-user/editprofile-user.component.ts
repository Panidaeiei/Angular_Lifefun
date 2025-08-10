import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { Router } from '@angular/router';


import { EditUser } from '../../models/edit-user.model';
import { UserService } from '../../services/Userservice';
import { ConfirmDeuserDialogComponent } from '../../confirm-deuser-dialog/confirm-deuser-dialog.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editprofile-user',
  standalone: true,
  imports: [
    MatToolbarModule,
    RouterModule,
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './editprofile-user.component.html',
  styleUrls: ['./editprofile-user.component.scss'],
})
export class EditprofileUserComponent implements OnInit {
  userId: string = '';
  user: EditUser = {
    uid: '',
    email: '',
    username: '',
    phone: '',
    description: '',
    password: '',
    old_password: ''
  };
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  selectedFile: File | null = null; // เก็บไฟล์ที่เลือก
  isLoading: boolean = true;
  isPasswordVisible: boolean = false;
  isNewPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;

  constructor(private userService: UserService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog) { }

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    const userId = this.route.snapshot.queryParamMap.get('id'); // ดึง UID จาก Query Parameters
    if (userId) {
      this.isLoading = true;
      this.loadUserProfile(userId);
    } else {
      console.error('User ID not found in query parameters');
    }

    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID from query params:', this.userId);
      } else {
        // ลองดึง userId จาก LocalStorage หากไม่มีใน Query Parameters
        this.userId = localStorage.getItem('uid') || '';
        if (!this.userId) {
          console.warn('User ID not found in query parameters or localStorage.');
        }
      }
    });
  }

  // โหลดข้อมูลผู้ใช้
  loadUserProfile(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (data) => {
        this.user = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.isLoading = false;
      }
    });
  }

  // เมื่อคลิกที่ไอคอนแก้ไข ให้เปิด input file
  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click(); // เปิดหน้าต่างเลือกไฟล์
    }
  }

  // ฟังก์ชันสำหรับจัดการเมื่อมีการเลือกไฟล์
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
      if (!this.isImageFile(file)) {
        Swal.fire({
          icon: 'error',
          title: 'ไฟล์ไม่ถูกต้อง',
          text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WebP)',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#f44336'
        });
        return;
      }

      this.selectedFile = file;

      // แสดงตัวอย่างรูปภาพใหม่
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.image_url = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // ฟังก์ชันตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
  private isImageFile(file: File): boolean {
    // ตรวจสอบ MIME type
    const validImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml'
    ];
    
    // ตรวจสอบนามสกุลไฟล์
    const validExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'
    ];
    
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    
    // ตรวจสอบทั้ง MIME type และนามสกุลไฟล์
    return validImageTypes.includes(file.type) || validExtensions.includes(fileExtension);
  }

  uploadProfileImage(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile);

      // เรียก API สำหรับอัปโหลดรูปภาพ
      console.log('Uploading image:', this.selectedFile.name);
      // เพิ่มโค้ดสำหรับเรียก API ที่นี่
    }
  }

  // เปิด dialog เปลี่ยนรหัสผ่านแบบมินิมอล
  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '100%',
      maxWidth: '420px',
      panelClass: 'minimal-dialog',
      data: { uid: this.user.uid }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'changed') {
        alert('เปลี่ยนรหัสผ่านสำเร็จ');
      }
    });
  }

  // บันทึกข้อมูล
  onSaveProfile(): void {
    // ตรวจสอบว่าฟิลด์ที่จำเป็นไม่เป็นค่าว่าง
    if (!this.user.username || this.user.username.trim() === '') {
      alert('กรุณากรอกชื่อผู้ใช้');
      return;
    }

    // ตรวจสอบว่า username เป็นไปตามเงื่อนไข (เหมือนกับตอนลงทะเบียน)
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/; // เงื่อนไข username
    if (!usernameRegex.test(this.user.username)) {
      Swal.fire({
        icon: 'warning',
        text: 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร และใช้ได้เฉพาะ a-z, A-Z, 0-9, จุด (.) และขีดล่าง (_)',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
    

    if (!this.user.email || this.user.email.trim() === '') {
      alert('กรุณากรอกอีเมล');
      return;
    }

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.user.email)) {
      alert('กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง เช่น example@domain.com');
      return;
    }

    // ตรวจสอบความยาวของอีเมล
    if (this.user.email.length > 254) {
      alert('อีเมลต้องมีความยาวไม่เกิน 254 ตัวอักษร');
      return;
    }

    // ตรวจสอบว่าอีเมลไม่ขึ้นต้นหรือลงท้ายด้วยจุด
    if (this.user.email.startsWith('.') || this.user.email.endsWith('.')) {
      alert('อีเมลไม่สามารถขึ้นต้นหรือลงท้ายด้วยจุดได้');
      return;
    }

    // ตรวจสอบว่ามี @ เพียงตัวเดียว
    const atCount = (this.user.email.match(/@/g) || []).length;
    if (atCount !== 1) {
      alert('อีเมลต้องมีเครื่องหมาย @ เพียงตัวเดียว');
      return;
    }

    if (!this.user.phone || this.user.phone.trim() === '') {
      alert('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    // ตรวจสอบรูปแบบเบอร์โทรศัพท์ (เบอร์ไทย)
    const phoneRegex = /^[0-9]{9,10}$/;
    if (!phoneRegex.test(this.user.phone.replace(/\s/g, ''))) {
      alert('กรุณากรอกเบอร์โทรศัพท์ในรูปแบบที่ถูกต้อง (9-10 หลัก)');
      return;
    }

    // ตัดเรื่องเปลี่ยนรหัสผ่านออกจากฟอร์มนี้ทั้งหมด (ย้ายไป dialog แทน)
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    // ตรวจสอบรูปโปรไฟล์ (ถ้ามี)
    if (this.selectedFile && !this.isImageFile(this.selectedFile)) {
      Swal.fire({
        icon: 'error',
        title: 'ไฟล์ไม่ถูกต้อง',
        text: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF, WebP)',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#f44336'
      });
      return;
    }

    this.isLoading = true;
    const formData = new FormData();

    // ตรวจสอบก่อนเพิ่มค่า
    if (this.user.uid) {
      formData.append('uid', this.user.uid);
    }
    if (this.user.email) {
      formData.append('email', this.user.email);
    }
    if (this.user.username) {
      formData.append('username', this.user.username);
    }
    if (this.user.phone) {
      formData.append('phone', this.user.phone);
    }
    // ส่ง description เสมอ (รวมถึงค่าว่างเพื่อลบ description)
    formData.append('description', this.user.description || '');
    // ไม่แนบรหัสผ่านจากฟอร์มนี้อีกต่อไป
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.userService.updateUser(formData).subscribe({
      next: (response) => {
        console.log('✅ Success response:', response);
        console.log('✅ Response type:', typeof response);
        console.log('✅ Response message:', response.message);

        // ตรวจสอบว่า response มี error หรือไม่
        if (response.error || response.errors) {
          console.error('❌ Backend returned error in success response:', response);
          let errorMessage = response.error || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล';
          if (response.errors) {
            errorMessage = Object.values(response.errors).join('\n');
          }
          alert(errorMessage);
          this.isLoading = false;
          return;
        }
        this.user = response.user;
        alert(response.message || 'อัปเดตข้อมูลสำเร็จ');
        this.router.navigate(['/ProfileUser'], { queryParams: { id: this.userId } });
      },
      error: (error) => {
        console.error('❌ Error updating user:', error);
        console.log('📌 Full error object:', error);
        console.log('📌 Error status:', error.status);
        console.log('📌 Error message:', error.message);
        console.log('📌 Error error:', error.error);

        let errorMessage = 'รหัสผ่านเดิมไม่ถูกต้อง!';

        // ✅ กรณีที่ error เป็น `Error` object และอยู่ใน `error.message`
        let backendResponse;
        try {
          backendResponse = JSON.parse(error.message); // ลองแปลงเป็น JSON
        } catch (e) {
          backendResponse = error.error || {}; // ถ้าแปลงไม่ได้ ใช้ error.error แทน
        }

        // ✅ ถ้า backendResponse มี errors ให้ดึงมาแสดงผล
        if (backendResponse.errors) {
          const errors = backendResponse.errors;
          errorMessage = '';

          if (errors.username) {
            errorMessage += errors.username + '\n';
          }
          if (errors.email) {
            errorMessage += errors.email + '\n';
          }
          if (errors.phone) {
            errorMessage += errors.phone + '\n';
          }
        }

        alert(errorMessage.trim()); // ✅ แจ้งเตือนข้อผิดพลาด และให้ผู้ใช้แก้ไขข้อมูล
        this.isLoading = false;
      }
    });

  }


  onDeleteUser(): void {
    const dialogRef = this.dialog.open(ConfirmDeuserDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true; // เริ่มโหลด
        this.userService.deleteUser(this.userId).subscribe({
          next: (response) => {
            alert('ลบบัญชีและข้อมูลสำเร็จ');
            console.log('Delete response:', response);
            this.isLoading = false; // หยุดโหลดเมื่อเสร็จ
            this.router.navigate(['/login']); // ไปยังหน้าล็อกอิน
          },
          error: (err) => {
            console.error('Error deleting user:', err);
            alert('เกิดข้อผิดพลาดในการลบบัญชี');
            this.isLoading = false; // หยุดโหลดเมื่อเกิดข้อผิดพลาด
          }
        });
      }
    });
  }


  // ยกเลิก
  onCancel(): void {
    window.history.back();
  }

  togglePasswordVisibility(field: string) {

    if (field === 'pass') {
      this.isPasswordVisible = !this.isPasswordVisible;

    } else if (field === 'new') {
      this.isNewPasswordVisible = !this.isNewPasswordVisible;
    } else {
      this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
    }
  }

}
