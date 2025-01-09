import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';

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
  errorMessage: string = ''; // ข้อความแสดงข้อผิดพลาด (ถ้ามี)

  constructor(private http: HttpClient, private router: Router) { }

  // ฟังก์ชันสำหรับการล็อกอิน
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

    this.http.post('http://localhost:3000/api/login', payload).subscribe(
      (response: any) => {
        // เก็บ JWT ใน localStorage
        localStorage.setItem('token', response.token);

        // เก็บข้อมูลผู้ใช้ใน localStorage
        localStorage.setItem('userId', response.id);
        localStorage.setItem('userRole', response.role);

        // นำทางไปยังหน้า Home ตาม role
        if (response.role === 'admin') {
          this.router.navigate(['/HomepageAdmin'], { queryParams: { id: response.id } });
        } else if (response.role === 'user') {
          this.router.navigate(['/HomepageUser'], { queryParams: { id: response.id } });
        }
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          text: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง!',
        });
      }
    );

  }

  // ตรวจสอบว่าข้อมูลที่กรอกเป็น Email หรือไม่
  private isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
}