import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/Userservice';

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
  <div class="fpd-container" role="dialog" aria-labelledby="fpd-title">
    <div class="fpd-header">
      <h3 id="fpd-title">ลืมรหัสผ่าน</h3>
      <button class="icon-btn" aria-label="ปิด" (click)="close()">×</button>
    </div>

    <div class="fpd-content">
      <p class="fpd-description">กรอกอีเมลหรือเบอร์โทรศัพท์เพื่อกู้คืนบัญชีของคุณ</p>

      <form (ngSubmit)="onSubmit()" class="fpd-form">
        <div class="fpd-field">
          <label for="email">อีเมล (E-mail)</label>
          <input 
            id="email"
            type="email" 
            [(ngModel)]="email" 
            name="email" 
            placeholder="กรอกอีเมลของคุณ" 
            [disabled]="isLoading"
          />
        </div>

        <div class="divider">
          <span style="">หรือ</span>
        </div>

        <div class="fpd-field">
          <label for="phone">เบอร์โทรศัพท์ (Phone)</label>
          <input 
            id="phone"
            type="tel" 
            [(ngModel)]="phone" 
            name="phone" 
            placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก" 
            maxlength="10"
            [disabled]="isLoading"
          />
        </div>

        <!-- แสดงข้อความ error -->
        <div class="fpd-error" *ngIf="errorMessage">
          <i class="fa fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>

        <!-- แสดงข้อความ success -->
        <div class="fpd-success" *ngIf="successMessage">
          <i class="fa fa-check-circle"></i>
          {{ successMessage }}
        </div>

        <!-- แสดงข้อมูลผู้ใช้ที่พบ -->
        <div class="fpd-user-info" *ngIf="userInfo">
          <div class="user-card">
            <div class="user-avatar">
              <i class="fa fa-user"></i>
            </div>
            <div class="user-details">
              <h4>{{ userInfo.username }}</h4>
              <p>{{ userInfo.email }}</p>
              <p *ngIf="userInfo.phone">{{ userInfo.phone }}</p>
            </div>
          </div>
        </div>

        <!-- ปุ่มต่างๆ -->
        <div class="fpd-actions">
          <button 
            type="submit" 
            class="btn primary" 
            [disabled]="isLoading || (!email && !phone)"
          >
            <ng-container *ngIf="!isLoading">ค้นหาบัญชี</ng-container>
            <ng-container *ngIf="isLoading">
              <i class="fa fa-spinner fa-spin"></i> กำลังค้นหา...
            </ng-container>
          </button>

          <button 
            type="button" 
            class="btn secondary" 
            (click)="goToResetPassword()"
            *ngIf="userInfo"
          >
            ตั้งรหัสผ่านใหม่
          </button>

          <button 
            type="button" 
            class="btn cancel" 
            (click)="close()"
            [disabled]="isLoading"
          >
            ปิด
          </button>
        </div>
      </form>
    </div>
  </div>
  `,
  styles: [`
  .fpd-container {
    padding: 20px;
    max-width: 500px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .fpd-container * {
    box-sizing: border-box;
  }
  
  .fpd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
  }
  
  h3 {
    margin: 0;
    font-weight: 600;
    color: #333;
    font-size: 24px;
  }
  
  .icon-btn {
    border: none;
    background: none;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: #888;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
  
  .icon-btn:hover {
    background: #f5f5f5;
    color: #333;
  }
  
  .fpd-content {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .fpd-description {
    color: #666;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .fpd-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .fpd-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .fpd-field label {
    font-size: 14px;
    color: #444;
    font-weight: 500;
  }
  
  .fpd-field input {
    width: 100%;
    padding: 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    background: #fafafa;
    outline: none;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  
  .fpd-field input:focus {
    border-color: #e27c96;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(226, 124, 150, 0.1);
  }
  
  .fpd-field input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .divider {
    text-align: center;
    position: relative;
    margin: 10px 0;
  }
  
  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: #e0e0e0;
  }
  
  .divider span {
    background: #fff;
    padding: 0 15px;
    color: #666;
    font-size: 14px;
    position: relative;
    z-index: 1;
  }
  
  .fpd-error {
    background: #fee;
    color: #c33;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #fcc;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .fpd-success {
    background: #efe;
    color: #3c3;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #cfc;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .fpd-user-info {
    margin: 15px 0;
  }
  
  .user-card {
    background: #f8f9fa;
    border: 2px solid #e27c96;
    border-radius: 12px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    background: #e27c96;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
  }
  
  .user-details h4 {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 16px;
  }
  
  .user-details p {
    margin: 0;
    color: #666;
    font-size: 13px;
  }
  
  .fpd-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }
  
  .btn {
    padding: 12px 20px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .btn.primary {
    background: linear-gradient(135deg, #e27c96, #d65a7a);
    color: white;
    box-shadow: 0 4px 15px rgba(226, 124, 150, 0.3);
  }
  
  .btn.primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(226, 124, 150, 0.4);
  }
  
  .btn.secondary {
    background: linear-gradient(135deg, #6c757d, #5a6268);
    color: white;
    box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
  }
  
  .btn.secondary:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
  }
  
  .btn.cancel {
    background: #f1f1f1;
    color: #333;
  }
  
  .btn.cancel:hover:not(:disabled) {
    background: #e0e0e0;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 600px) {
    .fpd-container {
      padding: 15px;
    }
    
    .fpd-actions {
      gap: 8px;
    }
    
    .btn {
      padding: 10px 15px;
      font-size: 13px;
    }
  }
  `]
})
export class ForgotPasswordDialogComponent {
  email: string = '';
  phone: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  userInfo: any = null;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close() { 
    this.dialogRef.close(); 
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.userInfo = null;

    if (!this.email && !this.phone) {
      this.errorMessage = 'กรุณากรอกอีเมลหรือเบอร์โทรศัพท์';
      return;
    }

    if (this.email && !this.isValidEmail(this.email)) {
      this.errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
      return;
    }

    if (this.phone && !this.isValidPhone(this.phone)) {
      this.errorMessage = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก';
      return;
    }

    this.isLoading = true;

    this.userService.forgotPassword(this.email || undefined, this.phone || undefined).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.userInfo = response.user;
          this.successMessage = 'พบข้อมูลผู้ใช้ในระบบ กรุณาตั้งรหัสผ่านใหม่';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      }
    });
  }

  goToResetPassword() {
    if (this.userInfo) {
      // ปิด dialog นี้และเปิด reset password dialog
      this.dialogRef.close({
        action: 'reset-password',
        userInfo: this.userInfo
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  }
}
