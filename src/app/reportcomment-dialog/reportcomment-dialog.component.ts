import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-reportcomment-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule],
  templateUrl: './reportcomment-dialog.component.html',
  styleUrl: './reportcomment-dialog.component.scss'
})
export class ReportcommentDialogComponent {
  reason: string = '';

  constructor(
    public dialogRef: MatDialogRef<ReportcommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onSubmit() {
    this.dialogRef.close(this.reason);
  }

  onCancel() {
    this.dialogRef.close();
  }

}
