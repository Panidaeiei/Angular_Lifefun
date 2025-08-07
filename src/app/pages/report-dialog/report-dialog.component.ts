import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ReactPostservice } from '../../services/ReactPostservice';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule],
  templateUrl: './report-dialog.component.html',
  styleUrl: './report-dialog.component.scss'
})
export class ReportDialogComponent {
  reason: string = '';

  constructor(
    private reportService: ReactPostservice,
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onSubmit(): void {
    console.log('ค่าที่ส่ง:', {
      reason: this.reason,
      pid: this.data.pid,
      uid: this.data.uid
    });

    this.dialogRef.close(true);
    this.reportService.sendReport(this.reason, this.data.pid, this.data.uid).subscribe({
      next: res => {
        console.log('Response จาก server:', res);  // ลองดูค่าที่นี่ว่าคืออะไร
        alert('รายงานเสร็จเรียบร้อย');
        this.dialogRef.close();
      },
      error: err => {
        console.error('เกิดข้อผิดพลาด:', err);
        alert('รายงานไม่สำเร็จ');
      }
    });

  }


  onCancel() {
    this.dialogRef.close();
  }

}
