import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { UserService } from '../../services/Userservice';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule, HttpClientModule]
})
export class LoginComponent {
  identifier: string = ''; // ตัวแปรสำหรับเก็บ Email หรือ Username
  password: string = '';   // ตัวแปรสำหรับเก็บ Password
  errorMessage: string = ''; 
  isPasswordVisible: boolean = false;

  constructor(private http: HttpClient, private router: Router,private userService: UserService, ) { }

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
  
    this.http.post('http://projectnodejs.thammadalok.com/lifefunproject/login', payload).subscribe(
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
  
        // ถ้า login สำเร็จให้บันทึก token
        localStorage.setItem('token', response.token);
        sessionStorage.setItem('token', response.token);
  
        localStorage.setItem('userId', response.id);
        sessionStorage.setItem('userId', response.id);
  
        localStorage.setItem('userRole', response.role);
        sessionStorage.setItem('userRole', response.role);
  
        this.userService.setCurrentUserId(response.id);
  
        // นำทางไปยังหน้า Home ตาม role
        if (response.role === 'admin') {
          this.router.navigate(['/HomepageAdmin'], { queryParams: { id: response.id } });
        } else if (response.role === 'user') {
          this.router.navigate(['/HomepageUser'], { queryParams: { id: response.id } });
        }
      },
      (error) => {
        console.log("เกิดข้อผิดพลาด:", error); // 🔍 ตรวจสอบค่าที่ API ส่งกลับมา
        console.log("error.error:", error.error); // ดูค่าที่อยู่ใน error.error
        console.log("error.error.status:", error.error?.status); // ดูค่าที่ API ส่งมา
      
        if (error.status === 403) {
          Swal.fire({
            icon: 'warning',
            title: 'บัญชีถูกระงับ',
            text: 'บัญชีของคุณถูกระงับเนื่องจากทำผิดกฏของชุมชนเรา',
          });
        } else {
          Swal.fire({
            icon: 'error',
            text: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง!',
          });
        }
      }
      
    );
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