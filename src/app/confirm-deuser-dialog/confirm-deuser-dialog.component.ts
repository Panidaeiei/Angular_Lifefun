import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-deuser-dialog',
  imports: [],
  templateUrl: './confirm-deuser-dialog.component.html',
  styleUrl: './confirm-deuser-dialog.component.scss'
})
export class ConfirmDeuserDialogComponent {
    constructor(public dialogRef: MatDialogRef<ConfirmDeuserDialogComponent>) { }
  
    onConfirm(): void {
      this.dialogRef.close(true);  // ส่งค่าการยืนยันกลับ
    }
  
    onCancel(): void {
      this.dialogRef.close(false);  // ส่งค่าการยกเลิกกลับ
    }
}
