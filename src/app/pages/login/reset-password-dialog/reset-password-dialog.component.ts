import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/Userservice';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
  <div class="rpd-container" role="dialog" aria-labelledby="rpd-title">
    <div class="rpd-header">
      <h3 id="rpd-title">ตั้งรหัสผ่านใหม่</h3>
      <button class="icon-btn" aria-label="ปิด" (click)="close()">×</button>
    </div>

    <div class="rpd-content">
      <p class="rpd-description">ตั้งรหัสผ่านใหม่สำหรับบัญชี {{ userInfo?.username || userInfo?.email || 'ผู้ใช้' }}</p>

      <!-- แสดงข้อมูลผู้ใช้ -->
      <div class="rpd-user-info" *ngIf="userInfo">
        <div class="user-card">
          <div class="user-avatar">
            <i class="fa fa-user"></i>
          </div>
          <div class="user-details">
            <h4>{{ userInfo.username || 'ผู้ใช้' }}</h4>
            <p>{{ userInfo.email }}</p>
          </div>
        </div>
      </div>

      <form (ngSubmit)="onSubmit()" class="rpd-form">
        <div class="rpd-field" [class.invalid]="submitted && !isNewPasswordValid()">
          <label for="newPassword">รหัสผ่านใหม่</label>
          <div class="input-wrap">
            <input 
              id="newPassword"
              [type]="showPassword ? 'text' : 'password'" 
              [(ngModel)]="newPassword" 
              name="newPassword" 
              placeholder="กรอกรหัสผ่านใหม่" 
              [disabled]="isLoading"
              (input)="submitted = false"
            />
            <button 
              type="button" 
              (click)="togglePasswordVisibility()" 
              class="toggle-btn"
              [disabled]="isLoading"
            >
              <i [class]="showPassword ? 'fa fa-eye' : 'fa fa-eye-slash'"></i>
            </button>
          </div>
          
          <!-- แสดงความแข็งแรงของรหัสผ่าน -->
          <div class="password-strength" *ngIf="newPassword">
            <div class="strength-bar">
              <div 
                class="strength-fill" 
                [class]="getPasswordStrengthClass()"
              ></div>
            </div>
            <span 
              class="strength-text" 
              [class]="getPasswordStrengthClass()"
            >
              {{ getPasswordStrengthMessage() }}
            </span>
          </div>
        </div>

        <div class="rpd-field" [class.invalid]="submitted && newPassword !== confirmPassword">
          <label for="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
          <div class="input-wrap">
            <input 
              id="confirmPassword"
              [type]="showConfirmPassword ? 'text' : 'password'" 
              [(ngModel)]="confirmPassword" 
              name="confirmPassword" 
              placeholder="ยืนยันรหัสผ่านใหม่" 
              [disabled]="isLoading"
              (input)="submitted = false"
            />
            <button 
              type="button" 
              (click)="toggleConfirmPasswordVisibility()" 
              class="toggle-btn"
              [disabled]="isLoading"
            >
              <i [class]="showConfirmPassword ? 'fa fa-eye' : 'fa fa-eye-slash'"></i>
            </button>
          </div>
          
          <!-- แสดงข้อความยืนยันรหัสผ่าน -->
          <div class="confirm-message" *ngIf="confirmPassword && newPassword !== confirmPassword">
            <i class="fa fa-exclamation-triangle"></i>
            รหัสผ่านไม่ตรงกัน
          </div>
          <div class="confirm-message success" *ngIf="confirmPassword && newPassword === confirmPassword && isPasswordStrong()">
            <i class="fa fa-check-circle"></i>
            รหัสผ่านตรงกันและแข็งแรง
          </div>
        </div>

        <!-- แสดงข้อความ error -->
        <div class="rpd-error" *ngIf="errorMessage">
          <i class="fa fa-exclamation-circle"></i>
          {{ errorMessage }}
        </div>

        <!-- แสดงข้อความ success -->
        <div class="rpd-success" *ngIf="successMessage">
          <i class="fa fa-check-circle"></i>
          {{ successMessage }}
        </div>

        <!-- แสดงข้อความ validation -->
        <div class="rpd-validation" *ngIf="submitted && !isFormValid()">
          <i class="fa fa-info-circle"></i>
          กรุณาตรวจสอบข้อมูลที่กรอก
        </div>

        <!-- ปุ่มต่างๆ -->
        <div class="rpd-actions">
          <button 
            type="submit" 
            class="btn primary" 
            [disabled]="isLoading || !isFormValid()"
          >
            <ng-container *ngIf="!isLoading">ตั้งรหัสผ่านใหม่</ng-container>
            <ng-container *ngIf="isLoading">
              <i class="fa fa-spinner fa-spin"></i> กำลังบันทึก...
            </ng-container>
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
  .rpd-container {
    padding: 20px;
    max-width: 500px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .rpd-container * {
    box-sizing: border-box;
  }
  
  .rpd-header {
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
  
  .rpd-content {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  .rpd-description {
    color: #666;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .rpd-user-info {
    margin-bottom: 20px;
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
  
  .rpd-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .rpd-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .rpd-field label {
    font-size: 14px;
    color: #444;
    font-weight: 500;
  }
  
  .input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-wrap input {
    width: 100%;
    padding: 12px 45px 12px 15px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    background: #fafafa;
    outline: none;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  
  .input-wrap input:focus {
    border-color: #e27c96;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(226, 124, 150, 0.1);
  }
  
  .input-wrap input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  .toggle-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 16px;
    padding: 5px;
    transition: color 0.3s ease;
  }
  
  .toggle-btn:hover:not(:disabled) {
    color: #e27c96;
  }
  
  .toggle-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .rpd-field.invalid .input-wrap input {
    border-color: #e74c3c;
    background: #fff0f0;
  }
  
  .password-strength {
    margin-top: 8px;
  }
  
  .strength-bar {
    width: 100%;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 5px;
  }
  
  .strength-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: 2px;
  }
  
  .strength-fill.weak {
    width: 33%;
    background: #e74c3c;
  }
  
  .strength-fill.medium {
    width: 66%;
    background: #f39c12;
  }
  
  .strength-fill.strong {
    width: 100%;
    background: #27ae60;
  }
  
  .strength-text {
    font-size: 12px;
    font-weight: 500;
  }
  
  .strength-text.weak {
    color: #e74c3c;
  }
  
  .strength-text.medium {
    color: #f39c12;
  }
  
  .strength-text.strong {
    color: #27ae60;
  }
  
  .confirm-message {
    font-size: 12px;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .confirm-message:not(.success) {
    color: #e74c3c;
  }
  
  .confirm-message.success {
    color: #27ae60;
  }
  
  .rpd-error {
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
  
  .rpd-success {
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
  
  .rpd-validation {
    background: #fff3cd;
    color: #856404;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid #ffeaa7;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .rpd-actions {
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
    .rpd-container {
      padding: 15px;
    }
    
    .rpd-actions {
      gap: 8px;
    }
    
    .btn {
      padding: 10px 15px;
      font-size: 13px;
    }
  }
  `]
})
export class ResetPasswordDialogComponent {
  userInfo: any = null;
  newPassword: string = '';
  confirmPassword: string = '';
  showPassword: boolean = true;
  showConfirmPassword: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  submitted: boolean = false;

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userInfo: any }
  ) {
    this.userInfo = data.userInfo;
  }

  close() { 
    this.dialogRef.close(); 
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.submitted = true;

    if (!this.isFormValid()) {
      return;
    }

    this.isLoading = true;

    this.userService.resetPassword(this.userInfo.uid, this.newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่';
          setTimeout(() => {
            this.dialogRef.close('success');
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      }
    });
  }

  isNewPasswordValid(): boolean {
    return this.newPassword.length >= 8 && this.isPasswordStrong();
  }

  isFormValid(): boolean {
    return this.newPassword.length >= 8 && 
           this.newPassword === this.confirmPassword &&
           this.isPasswordStrong();
  }

  isPasswordStrong(): boolean {
    const password = this.newPassword;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    const noWhitespace = /^\S+$/.test(password);
    
    return hasLetter && hasNumber && hasMinLength && noWhitespace;
  }

  getPasswordStrengthMessage(): string {
    const password = this.newPassword;
    
    if (!password) return '';
    if (password.length < 8) return 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร';
    if (!/^\S+$/.test(password)) return 'ห้ามมีช่องว่างในรหัสผ่าน';
    if (!/[A-Za-z]/.test(password)) return 'ต้องมีตัวอักษรอย่างน้อย 1 ตัว';
    if (!/\d/.test(password)) return 'ต้องมีตัวเลขอย่างน้อย 1 ตัว';
    
    return 'รหัสผ่านแข็งแรง';
  }

  getPasswordStrengthClass(): string {
    const password = this.newPassword;
    
    if (!password) return '';
    if (password.length < 8 || !/^\S+$/.test(password)) return 'weak';
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'medium';
    
    return 'strong';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
