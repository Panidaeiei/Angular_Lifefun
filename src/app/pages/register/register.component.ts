import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { UserService } from '../../services/Userservice';
import { User } from '../../models/register_model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  userData: User = {
    email: '',
    password: '',
    username: '',
    phone: '',
    image_url: '',
  };

  confirmPassword: string = ''; // ตัวแปรสำหรับยืนยันรหัสผ่าน
  selectedFile: File | null = null; // ตัวแปรสำหรับไฟล์ที่เลือก
  previewImage: string = 'https://scontent.fbkk10-1.fna.fbcdn.net/v/t1.15752-9/467486088_9395369247162722_9124289913270465764_n.png?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=2RTdWkSDo2UQ7kNvgEH-_5J&_nc_zt=23&_nc_ht=scontent.fbkk10-1.fna&oh=03_Q7cD1gFbqFNDtEI2fV3h-86ZYef56ySuHmYe-BRdNTjy3Vyi9g&oe=67CAB874'; // รูปเริ่มต้น

  constructor(private userService: UserService, private router: Router) { }

  // ฟังก์ชันจัดการการเลือกไฟล์
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 300; // ความกว้างสูงสุดของรูปภาพที่ลดขนาด
          const maxHeight = 300; // ความสูงสูงสุดของรูปภาพที่ลดขนาด

          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (maxHeight / width) * height;
              width = maxWidth;
            } else {
              width = (maxWidth / height) * width;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // แปลงรูปภาพที่ลดขนาดแล้วเป็น Base64
          this.previewImage = canvas.toDataURL('image/jpeg', 0.8); // คุณภาพของภาพ: 0.8 (80%)
          this.userData.image_url = this.previewImage; // อัปเดต URL รูปภาพ
        };
      };
      reader.readAsDataURL(this.selectedFile); // อ่านไฟล์และแปลงเป็น Base64
    }
  }

  // ฟังก์ชันสำหรับการลงทะเบียน
  register() {
    if (this.userData.password !== this.confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.userData.phone)) {
      alert('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก!');
      return;
    }
    
    // ตรวจสอบว่า username เป็นไปตามเงื่อนไข
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/; // เงื่อนไข username
    if (!usernameRegex.test(this.userData.username)) {
      alert('ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร และใช้ได้เฉพาะ a-z, A-Z, 0-9, จุด (.) และขีดล่าง (_)');
      return;
    }

    console.log('Data to be sent:', this.userData); // ตรวจสอบข้อมูลที่กำลังส่ง

    const formData = new FormData();
    formData.append('email', this.userData.email);
    formData.append('password', this.userData.password);
    formData.append('username', this.userData.username);
    formData.append('phone', this.userData.phone);
    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile); // แนบไฟล์รูปภาพ
    }

    this.userService.registerUser(formData).subscribe(
      (response) => {
        Swal.fire({
          icon: 'success',
          text: 'ลงทะเบียนสำเร็จ!',
          confirmButtonText: 'ตกลง',
        }).then(() => {
          this.router.navigate(['/login']); // นำทางไปหน้า Login
        });
      },
      (error) => {
        console.error('Error response:', error); // ดูข้อผิดพลาดจาก Backend

        // ตรวจสอบข้อความข้อผิดพลาดจาก Backend
        if (error.error?.error) {
          if (error.error.error.includes('email')) {
            Swal.fire({
              icon: 'error',
              text: 'อีเมลนี้มีผู้ใช้งานแล้ว!',
            });
          } else if (error.error.error.includes('username')) {
            Swal.fire({
              icon: 'error',
              text: 'ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว!',
            });
          } else if (error.error.error.includes('phone')) {
            Swal.fire({
              icon: 'error',
              text: 'หมายเลขโทรศัพท์นี้มีผู้ใช้งานแล้ว!',
            });
          } else {
            Swal.fire({
              icon: 'error',
              text: 'เกิดข้อผิดพลาด: ' + error.error.error,
            });
          }
        } else {
          Swal.fire({
            icon: 'error',
            text: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ!',
          });
        }
      }
    );
  }


}
