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
      this.selectedFile = input.files[0];

      // แสดงตัวอย่างรูปภาพใหม่
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.image_url = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
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

  // บันทึกข้อมูล
  onSaveProfile(): void {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/; // ต้องมีตัวอักษรและตัวเลขอย่างน้อย 1 ตัว ความยาว ≥ 8

    // ตรวจสอบว่ามีการเปลี่ยนรหัสผ่านหรือไม่
    // ✅ ถ้าผู้ใช้ต้องการเปลี่ยนรหัสผ่าน ต้องกรอกให้ครบทั้ง 3 ช่อง
    if (this.newPassword || this.confirmPassword || this.currentPassword) {
      if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
        alert('กรุณากรอกรหัสผ่านให้ครบทุกช่อง');
        return;
      }

      // ✅ เช็ครหัสผ่านใหม่ว่าตรงกับรหัสผ่านเดิมหรือไม่
      if (this.newPassword === this.currentPassword) {
        alert('คุณกรอกรหัสผ่านเดิม กรุณาใช้รหัสผ่านใหม่');
        return;
      }

      // ✅ ตรวจสอบความแข็งแรงของรหัสผ่าน
      if (!passwordRegex.test(this.newPassword)) {
        alert('รหัสผ่านต้องประกอบด้วย:\n- ตัวอักษร (A-Z, a-z)\n- ตัวเลข (0-9)\n- หรือตัวอักษรพิเศษ เช่น @$!%*?&\n- ความยาวอย่างน้อย 8 ตัวอักษร');
        return;
      }

      // ✅ ตรวจสอบว่ารหัสผ่านใหม่และรหัสผ่านยืนยันตรงกันหรือไม่
      if (this.newPassword !== this.confirmPassword) {
        alert('รหัสผ่านไม่ตรงกัน');
        return;
      }

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
    if (this.user.description) {
      formData.append('description', this.user.description);
    }
    if (this.newPassword) {
      formData.append('password', this.newPassword);
      formData.append('old_password', this.currentPassword);
    }
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.userService.updateUser(formData).subscribe({
      next: (response) => {
        alert(response.message || 'อัปเดตข้อมูลสำเร็จ');
        this.router.navigate(['/ProfileUser'], { queryParams: { id: this.userId } }); //ยังคงไปหน้าข้อมูลโปรไฟล์เมื่อลงทะเบียนสำเร็จ

      },
      error: (error) => {
        console.error('❌ Error updating user:', error);
        console.log('📌 Full error object:', error);
    
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
