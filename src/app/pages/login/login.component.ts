import { Component, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { UserService } from '../../services/Userservice';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { ForgotPasswordDialogComponent } from './forgot-password-dialog/forgot-password-dialog.component';
import { ResetPasswordDialogComponent } from './reset-password-dialog/reset-password-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, HttpClientModule, CommonModule, RouterModule, MatDialogModule]
})
export class LoginComponent {
  identifier: string = ''; // ตัวแปรสำหรับเก็บ Email หรือ Username
  password: string = '';   // ตัวแปรสำหรับเก็บ Password
  errorMessage: string = '';
  isPasswordVisible: boolean = false;
  isMobile = false;
  private baseUrl = environment.apiBaseUrl; // URL ของ Backend
// เก็บพาธปลายทางที่มากับ ?redirect=... (ถูก encode มา)
  private redirectUrl: string | null = null;
  constructor(
    private http: HttpClient, 
    private router: Router, 
    private userService: UserService, 
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) { }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.checkScreenSize();

    
    // เก็บ redirect ถ้ามี (เช่น /login?redirect=%2FHomepageUser%3Fid%3D35)
    this.redirectUrl = this.route.snapshot.queryParamMap.get('redirect')
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

 

    // ตรวจสอบว่า backend ทำงานอยู่หรือไม่
    console.log('🌐 Checking backend connection...');

    this.http.post(`${this.baseUrl}/login`, payload).subscribe(
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
          // set key ของ admin - ใช้ response.id ที่ backend ส่งมา
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
          // set key ของ user - ใช้ response.id ที่ backend ส่งมา
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
        console.error("❌ Login error:", error);
        console.log("เกิดข้อผิดพลาด:", error); // 🔍 ตรวจสอบค่าที่ API ส่งกลับมา
        console.log("error.error:", error.error); // ดูค่าที่อยู่ใน error.error
        console.log("error.error.status:", error.error?.status); // ดูค่าที่ API ส่งมา
        console.log("error.status:", error.status); // ดู HTTP status code
        console.log("error.message:", error.message); // ดู error message

        // ตรวจสอบประเภทของ error
        if (error.status === 0) {
          // Network error หรือ backend ไม่ทำงาน
          Swal.fire({
            icon: 'error',
            title: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
            text: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือลองใหม่อีกครั้ง',
          });
          console.error('🌐 Network error - Backend might be down');
        } else if (error.status === 400) {
          // Bad Request - ข้อมูลไม่ครบ
          Swal.fire({
            icon: 'error',
            title: 'ข้อมูลไม่ครบถ้วน',
            text: error.error?.error || 'กรุณากรอกข้อมูลให้ครบถ้วน',
          });
        } else if (error.status === 403 && error.error.end_date) {
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
        } else if (error.status === 500) {
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
            text: 'กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ',
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

  // เปิด dialog ลืมรหัสผ่าน
  openForgotPasswordDialog() {
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'reset-password') {
        // เปิด dialog ตั้งรหัสผ่านใหม่
        this.openResetPasswordDialog(result.userInfo);
      }
    });
  }

  // เปิด dialog ตั้งรหัสผ่านใหม่
  openResetPasswordDialog(userInfo: any) {
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      data: { userInfo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนรหัสผ่านสำเร็จ',
          text: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
          timer: 3000
        });
      }
    });
  }
}