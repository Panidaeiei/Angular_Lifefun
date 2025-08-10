import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/Userservice';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
  <div class="cpd-container" role="dialog" aria-labelledby="cpd-title">
    <div class="cpd-header">
      <h3 id="cpd-title">เปลี่ยนรหัสผ่าน</h3>
      <button class="icon-btn" aria-label="ปิด" (click)="close()">×</button>
    </div>

    <div class="cpd-field" [class.invalid]="(submitted && !oldPassword) || !!oldPasswordError">
      <label for="old">รหัสผ่านเดิม</label>
      <div class="input-wrap">
        <input id="old" [type]="showOld ? 'text' : 'password'" [(ngModel)]="oldPassword" autocomplete="current-password" (keydown.enter)="submit()" />
        <button type="button" class="toggle" (click)="showOld = !showOld" [attr.title]="showOld ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'" aria-label="แสดง/ซ่อนรหัสผ่าน">
          <i class="fa" [class.fa-eye]="showOld" [class.fa-eye-slash]="!showOld"></i>
        </button>
      </div>
      <small class="hint" *ngIf="submitted && !oldPassword">กรุณากรอกรหัสผ่านเดิม</small>
      <small class="hint error" *ngIf="oldPasswordError" aria-live="polite">{{ oldPasswordError }}</small>
    </div>

    <div class="cpd-field" [class.invalid]="submitted && !isNewPasswordValid()">
      <label for="new">รหัสผ่านใหม่</label>
      <div class="input-wrap">
        <input id="new" [type]="showNew ? 'text' : 'password'" [(ngModel)]="newPassword" autocomplete="new-password" (keydown.enter)="submit()" />
        <button type="button" class="toggle" (click)="showNew = !showNew" [attr.title]="showNew ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'" aria-label="แสดง/ซ่อนรหัสผ่าน">
          <i class="fa" [class.fa-eye]="showNew" [class.fa-eye-slash]="!showNew"></i>
        </button>
      </div>
      <small class="hint" *ngIf="submitted && !isNewPasswordValid()">{{ getNewPasswordHint() }}</small>
      <small class="policy" style="color:rgb(128, 125, 126); font-size:15px;">รูปแบบที่ถูกต้อง: ความยาว 8–64 ตัว, ไม่มีช่องว่าง, ต้องมีทั้งตัวอักษรและตัวเลข</small>
      <div class="examples">
        <span class="policy"  style="color:rgb(128, 125, 126); font-size:15px;">ตัวอย่างที่ถูกต้อง: </span>
        <span class="inline-examples" style="color:rgb(128, 125, 126);">Aloha2025, MintTea88 เป็นต้น</span>
      </div>
    </div>

    <div class="cpd-field" [class.invalid]="submitted && newPassword !== confirmPassword">
      <label for="confirm">ยืนยันรหัสผ่านใหม่</label>
      <div class="input-wrap">
        <input id="confirm" [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="confirmPassword" autocomplete="new-password" (keydown.enter)="submit()" />
        <button type="button" class="toggle" (click)="showConfirm = !showConfirm" [attr.title]="showConfirm ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'" aria-label="แสดง/ซ่อนรหัสผ่าน">
          <i class="fa" [class.fa-eye]="showConfirm" [class.fa-eye-slash]="!showConfirm"></i>
        </button>
      </div>
      <small class="hint" *ngIf="submitted && newPassword !== confirmPassword">รหัสผ่านใหม่ไม่ตรงกัน</small>
    </div>

    <div class="cpd-error" *ngIf="errorMessage">{{ errorMessage }}</div>

    <div class="cpd-actions">
      <button type="button" class="btn cancel" (click)="close()" [disabled]="loading">ยกเลิก</button>
      <button type="button" class="btn save" (click)="submit()" [disabled]="loading || !hasFilledAll()">
        <ng-container *ngIf="!loading">บันทึก</ng-container>
        <ng-container *ngIf="loading"><i class="fa fa-spinner fa-spin"></i> กำลังบันทึก</ng-container>
      </button>
    </div>
  </div>
  `,
  styles: [`
  .cpd-container{padding:16px 18px;max-width:100%;box-sizing:border-box;overflow-x:hidden}
  .cpd-container *{box-sizing:border-box}
  .cpd-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  h3{margin:0;font-weight:600;color:#222;font-size:18px}
  .icon-btn{border:none;background:none;font-size:22px;line-height:1;cursor:pointer;color:#888}
  .cpd-field{display:flex;flex-direction:column;gap:6px;margin:12px 0}
  .cpd-field label{font-size:14px;color:#444}
  .input-wrap{position:relative}
  .input-wrap input{width:100%;padding:10px 38px 10px 12px;border:1px solid #e0e0e0;border-radius:10px;background:#fafafa;outline:none;font-size:14px;transition:border .2s;box-sizing:border-box}
  .input-wrap input:focus{border:1.5px solid #e27c96;background:#fff}
  .toggle{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:none;background:none;color:#888;cursor:pointer}
  .hint{color:#e27c96;font-size:12px}
  .cpd-field.invalid .input-wrap input{border-color:#f2a3a3;background:#fff0f0}
  .cpd-error{color:#e74c3c;margin-top:6px;font-size:13px}
  .cpd-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
  .btn{padding:9px 14px;border-radius:10px;border:none;cursor:pointer;font-size:14px}
  .btn.cancel{background:#f1f1f1;color:#333}
  .btn.save{background:#e27c96;color:#fff}
  /* Hide native reveal/clear icons (Edge/IE/Chromium variants) */
  input[type="password"]::-ms-reveal,
  input[type="password"]::-ms-clear,
  input::-ms-reveal,
  input::-ms-clear{ display:none; width:0; height:0; }
  /* Hide WebKit credentials autofill button */
  input[type="password"]::-webkit-credentials-auto-fill-button{ visibility:hidden; display:none; pointer-events:none; width:0; height:0; }
  @media (max-width:600px){.cpd-container{padding:12px}.cpd-actions{flex-direction:column}.btn{width:100%}}
  `]
})
export class ChangePasswordDialogComponent {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  showOld = false;
  showNew = false;
  showConfirm = false;
  loading = false;
  errorMessage = '';
  submitted = false;
  oldPasswordError = '';

  constructor(
    private userService: UserService,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { uid: string }
  ) {}

  close() { this.dialogRef.close(); }

  isNewPasswordValid(): boolean {
    const newPass = (this.newPassword || '').trim();
    const oldPass = (this.oldPassword || '').trim();
    const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    const noWhitespace = /^\S+$/;
    const minLen = 8;
    const maxLen = 64;
    if (!newPass) return false;
    if (newPass.length < minLen || newPass.length > maxLen) return false;
    if (!noWhitespace.test(newPass)) return false;
    if (!hasLetterAndNumber.test(newPass)) return false;
    if (newPass === oldPass) return false;
    return true;
  }

  getNewPasswordHint(): string {
    const newPass = (this.newPassword || '').trim();
    const oldPass = (this.oldPassword || '').trim();
    if (!newPass) return 'กรุณากรอกรหัสผ่านใหม่';
    if (newPass === oldPass) return 'รหัสผ่านใหม่ต้องไม่เหมือนรหัสเดิม';
    if (newPass.length < 8) return 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว';
    if (newPass.length > 64) return 'รหัสผ่านยาวเกินไป (สูงสุด 64 ตัว)';
    if (/\s/.test(newPass)) return 'ห้ามมีช่องว่างในรหัสผ่าน';
    if (!(/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPass))) return 'ต้องมีทั้งตัวอักษรและตัวเลข';
    return 'รหัสผ่านไม่ถูกต้อง';
  }

  hasFilledAll(): boolean {
    return !!this.oldPassword && !!this.newPassword && !!this.confirmPassword;
  }

  submit() {
    this.errorMessage = '';
    this.submitted = true;
    if (!this.hasFilledAll()) { return; }
    // ตรวจ validate ก่อนส่ง
    if (!this.isNewPasswordValid()) { return; }
    if (this.newPassword !== this.confirmPassword) { return; }
    const uid = this.data?.uid || localStorage.getItem('userId') || '';
    const oldPass = (this.oldPassword || '').trim();
    const newPass = (this.newPassword || '').trim();
    if (!uid) { this.errorMessage = 'ไม่พบผู้ใช้'; return; }

    this.loading = true;
    this.userService.changePassword(uid, oldPass, newPass).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close('changed');
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        const api = err?.error || {};
        const backendMsg = api?.message || api?.error || err?.message || '';
        // จัดการกรณีรหัสผ่านเดิมไม่ถูกต้อง (มักเป็น 401 หรือข้อความเฉพาะ)
        if (status === 401 || /รหัสผ่านเดิมไม่ถูกต้อง|old\s*password\s*is\s*incorrect/i.test(backendMsg)) {
          this.oldPasswordError = 'รหัสผ่านเดิมไม่ถูกต้อง';
          this.errorMessage = '';
          return;
        }
        // อื่นๆ แสดงข้อความจาก backend ถ้ามี
        this.oldPasswordError = '';
        this.errorMessage = backendMsg || 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
      }
    });
  }

  
}


