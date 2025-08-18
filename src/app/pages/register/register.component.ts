import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { UserService } from '../../services/Userservice';
import { User } from '../../models/register_model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
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
  defaultImage: string = 'https://i.pinimg.com/736x/a8/0e/36/a80e3690318c08114011145fdcfa3ddb.jpg'; // รูปเริ่มต้น
  previewImage: string = this.defaultImage; // รูปเริ่มต้น

  isPasswordVisible: boolean = false;
  isConfirmPasswordVisible: boolean = false;
  isMobile = false;
  isLoading: boolean = false; // เพิ่ม loading state
  constructor(private userService: UserService, private router: Router, private location: Location) { }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 600;
  }

  // ฟังก์ชันจัดการการเลือกไฟล์
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
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

  // ฟังก์ชันยกเลิกรูปภาพ
  cancelImage(): void {
    this.previewImage = this.defaultImage;
    this.selectedFile = null;
    this.userData.image_url = '';
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

  
  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  toggleConfirmPasswordVisibility() {
    this.isConfirmPasswordVisible = !this.isConfirmPasswordVisible;
  }

  // ฟังก์ชันสำหรับการลงทะเบียน
  register() {
    // ตรวจสอบว่าผู้ใช้กรอกข้อมูลทุกฟิลด์หรือไม่
    if (!this.userData.email || !this.userData.password || !this.confirmPassword || !this.userData.username || !this.userData.phone) {
      Swal.fire({
        icon: 'warning',
        text: 'กรุณากรอกข้อมูลให้ครบ',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
  
    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.userData.email)) {
      Swal.fire({
        icon: 'warning',
        text: 'กรุณากรอกอีเมลในรูปแบบที่ถูกต้อง เช่น example@domain.com',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    // ตรวจสอบความยาวของอีเมล
    if (this.userData.email.length > 254) {
      Swal.fire({
        icon: 'warning',
        text: 'อีเมลต้องมีความยาวไม่เกิน 254 ตัวอักษร',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    // ตรวจสอบว่าอีเมลไม่ขึ้นต้นหรือลงท้ายด้วยจุด
    if (this.userData.email.startsWith('.') || this.userData.email.endsWith('.')) {
      Swal.fire({
        icon: 'warning',
        text: 'อีเมลไม่สามารถขึ้นต้นหรือลงท้ายด้วยจุดได้',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    // ตรวจสอบว่ามี @ เพียงตัวเดียว
    const atCount = (this.userData.email.match(/@/g) || []).length;
    if (atCount !== 1) {
      Swal.fire({
        icon: 'warning',
        text: 'อีเมลต้องมีเครื่องหมาย @ เพียงตัวเดียว',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
  
    // ตรวจสอบว่ารหัสผ่านกับการยืนยันรหัสผ่านตรงกัน
    if (this.userData.password !== this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        text: 'รหัสผ่านไม่ตรงกัน',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
  
    // กำหนดรูปแบบการตรวจสอบรหัสผ่าน
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(this.userData.password)) {
      Swal.fire({
        icon: 'warning',
        text: 'รหัสผ่านต้องประกอบด้วย: \n- ตัวอักษร (A-Z, a-z) \n- ตัวเลข (0-9) \n- หรือตัวอักษรพิเศษ เช่น @$!%*?& \n- ความยาวอย่างน้อย 8 ตัวอักษร',
        confirmButtonText: 'ตกลง'
      });
      return;
    }
    
    // ลบช่องว่างและเครื่องหมาย - ออกก่อนตรวจสอบ
    const cleanPhone = this.userData.phone.replace(/[\s\-]/g, '');
    
    // ตรวจสอบรูปแบบเบอร์มือถือ (06, 08, 09)
    const mobilePhoneRegex = /^(0[689][0-9]{8})$/;
    if (!mobilePhoneRegex.test(cleanPhone)) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณากรอกเบอร์มือถือเท่านั้น',
        html: `
          <div style="text-align: left;">
            <p>กรุณากรอกเบอร์มือถือในรูปแบบที่ถูกต้อง (10 หลัก)</p>
          </div>
        `,
        confirmButtonText: 'ตกลง'
      });
      return;
    }
    
    // อัปเดตเบอร์โทรศัพท์ให้เป็นรูปแบบที่สะอาด
    this.userData.phone = cleanPhone;
    
    // ตรวจสอบว่า username เป็นไปตามเงื่อนไข
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/; // เงื่อนไข username
    if (!usernameRegex.test(this.userData.username)) {
      Swal.fire({
        icon: 'warning',
        text: 'ชื่อผู้ใช้ต้องมีความยาวไม่เกิน 30 ตัวอักษร และใช้ได้เฉพาะ a-z, A-Z, 0-9, จุด (.) และขีดล่าง (_)',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

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
  
    // เริ่ม loading
    this.isLoading = true;
  
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
        // หยุด loading
        this.isLoading = false;
        
        Swal.fire({
          icon: 'success',
          title: 'ลงทะเบียนสำเร็จ!',
          text: 'ยินดีต้อนรับเข้าสู่ระบบ',
          confirmButtonText: 'ตกลง',
          confirmButtonColor: '#4CAF50'
        }).then(() => {
          this.router.navigate(['/login']); // นำทางไปหน้า Login
        });
      },
      (error) => {
        // หยุด loading
        this.isLoading = false;
        
        console.error('Error response:', error); // ดูข้อผิดพลาดจาก Backend
  
        // ตรวจสอบข้อความข้อผิดพลาดจาก Backend
        if (error.error?.error) {
          if (error.error.error.includes('email')) {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: 'อีเมลนี้มีผู้ใช้งานแล้ว!',
              confirmButtonText: 'ตกลง',
              confirmButtonColor: '#f44336'
            });
          } else if (error.error.error.includes('username')) {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: 'ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว!',
              confirmButtonText: 'ตกลง',
              confirmButtonColor: '#f44336'
            });
          } else if (error.error.error.includes('phone')) {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: 'หมายเลขโทรศัพท์นี้มีผู้ใช้งานแล้ว!',
              confirmButtonText: 'ตกลง',
              confirmButtonColor: '#f44336'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: 'เกิดข้อผิดพลาด: ' + error.error.error,
              confirmButtonText: 'ตกลง',
              confirmButtonColor: '#f44336'
            });
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ!',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#f44336'
          });
        }
      }
    );
  }
  
  goBack() {
    this.location.back();
  }
}
