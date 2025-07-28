import { Component, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { UserService } from '../../services/Userservice';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, HttpClientModule, CommonModule]
})
export class LoginComponent {
  identifier: string = ''; // ตัวแปรสำหรับเก็บ Email หรือ Username
  password: string = '';   // ตัวแปรสำหรับเก็บ Password
  errorMessage: string = '';
  isPasswordVisible: boolean = false;
  isMobile = false;

  constructor(private http: HttpClient, private router: Router, private userService: UserService, private route: ActivatedRoute) { }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();
    // แสดงข้อความเตือนถ้ามี error=unauthorized ใน query param
    this.route.queryParams.subscribe((params: any) => {
      if (params['error'] === 'unauthorized') {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณาเข้าสู่ระบบ',
          text: 'คุณต้องเข้าสู่ระบบก่อนใช้งานหน้านี้',
        });
      }
    });
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 900;
  }
  login() {
    if (!this.identifier || !this.password) {
      Swal.fire({
        icon: 'warning',
        text: 'กรุณากรอกอีเมลและรหัสผ่าน!',
      });
      return;
    }

    const payload = {
      email: this.isEmail(this.identifier) ? this.identifier : undefined,
      username: this.isEmail(this.identifier) ? undefined : this.identifier,
      password: this.password,
    };

    this.http.post('https://flim.k0n4n4p4.site/api/login', payload).subscribe(
      (response: any) => {
        // ตรวจสอบว่ามีสถานะของบัญชีและถูกระงับหรือไม่
        if (response.status === 0) {
          Swal.fire({
            icon: 'error',
            title: 'บัญชีถูกระงับ',
            text: 'บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ',
          });
          return;
        }

        if (response.role === 'admin') {
          // ลบ key ของ user
          localStorage.removeItem('userId');
          localStorage.removeItem('userRole');
          localStorage.removeItem('token');
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('token');
          // set key ของ admin
          localStorage.setItem('adminId', response.id);
          localStorage.setItem('adminRole', 'admin');
          localStorage.setItem('adminToken', response.token);
          sessionStorage.setItem('adminId', response.id);
          sessionStorage.setItem('adminRole', 'admin');
          sessionStorage.setItem('adminToken', response.token);
          this.userService.setCurrentUserId(response.id);
          this.router.navigate(['/userlist'], { queryParams: { id: response.id } });
        } else if (response.role === 'user') {
          // ลบ key ของ admin
          localStorage.removeItem('adminId');
          localStorage.removeItem('adminRole');
          localStorage.removeItem('adminToken');
          sessionStorage.removeItem('adminId');
          sessionStorage.removeItem('adminRole');
          sessionStorage.removeItem('adminToken');
          // set key ของ user
          localStorage.setItem('userId', response.id);
          localStorage.setItem('userRole', 'user');
          localStorage.setItem('token', response.token);
          sessionStorage.setItem('userId', response.id);
          sessionStorage.setItem('userRole', 'user');
          sessionStorage.setItem('token', response.token);
          this.userService.setCurrentUserId(response.id);
          this.router.navigate(['/HomepageUser'], { queryParams: { id: response.id } });
        }
      },
      (error) => {
        console.log("เกิดข้อผิดพลาด:", error); // 🔍 ตรวจสอบค่าที่ API ส่งกลับมา
        console.log("error.error:", error.error); // ดูค่าที่อยู่ใน error.error
        console.log("error.error.status:", error.error?.status); // ดูค่าที่ API ส่งมา

        if (error.status === 403 && error.error.end_date) {
          const endDate = new Date(error.error.end_date);
          const now = new Date();
          const diff = endDate.getTime() - now.getTime();

          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);

            Swal.fire({
              icon: 'warning',
              title: 'บัญชีถูกระงับ',         
              html: `เนื่องจากมีการโพสต์เนื้อหาที่ไม่เหมาะสม<br>บัญชีของคุณจึงถูกระงับถึงวันที่ <b>${endDate.toLocaleDateString()}</b><br>เหลือเวลาอีก <b>${days} วัน </b>`,
            });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'บัญชีถูกระงับ',
              text: 'บัญชีของคุณยังไม่ได้ปลดระงับ แต่กำหนดเวลาได้สิ้นสุดแล้ว กรุณาติดต่อแอดมิน',
            });
          }
        } else if (error.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            text: error.error?.error || 'รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง',
          });
        } else if (error.status === 404) {
          Swal.fire({
            icon: 'error',
            title: 'ไม่พบผู้ใช้',
            text: error.error?.error || 'ไม่พบอีเมลหรือชื่อผู้ใช้นี้ในระบบ',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: error.error?.error || 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่',
          });
        }
      }

    );
  }

  logout() {
    // ลบ key ของ user
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('token');
    // ลบ key ของ admin
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminId');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminToken');
    this.router.navigate(['/login']);
  }

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  // ตรวจสอบว่าข้อมูลที่กรอกเป็น Email หรือไม่
  private isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
}