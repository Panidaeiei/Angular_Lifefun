import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ReactPostservice } from '../../services/ReactPostservice';

interface Follower {
  following_id: string;
  username: string;
  image_url: string;
  display_name: string;
  create_at: string;
}

interface Following {
  followed_id: string;
  username: string;
  image_url: string;
  display_name: string;
  create_at: string;
}

@Component({
  selector: 'app-followers-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="followers-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ dialogTitle }} ({{ userList.length }})</h2>
        <button mat-icon-button (click)="closeDialog()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-dialog-content>
        <div *ngIf="isLoading" class="loading-container">
          <i class="fa fa-spinner fa-spin"></i>
          <p>กำลังโหลด...</p>
        </div>
        
        <div *ngIf="!isLoading && userList.length === 0" class="no-followers">
          <i class="fa fa-users"></i>
          <p>{{ emptyMessage }}</p>
        </div>
        
        <div *ngIf="!isLoading && userList.length > 0" class="followers-list">
          <div *ngFor="let user of userList" class="follower-item" (click)="goToProfile(getUserId(user))">
            <img [src]="user.image_url || 'https://i.pinimg.com/736x/a8/0e/36/a80e3690318c08114011145fdcfa3ddb.jpg'" 
                 [alt]="user.username" 
                 class="follower-avatar">
            <div class="follower-info">
              <span class="follower-name">{{ user.display_name || user.username }}</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="closeDialog()">ปิด</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .followers-dialog {
      font-family: 'Itim', serif;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .dialog-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.5rem;
    }
    
    .close-btn {
      color: #666;
    }
    
    mat-dialog-content {
      padding: 0;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
    }
    
    .loading-container i {
      font-size: 2rem;
      margin-bottom: 16px;
    }
    
    .no-followers {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #999;
    }
    
    .no-followers i {
      font-size: 3rem;
      margin-bottom: 16px;
    }
    
    .followers-list {
      padding: 0;
    }
    
    .follower-item {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .follower-item:hover {
      background-color: #f5f5f5;
    }
    
    .follower-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      margin-right: 12px;
    }
    
    .follower-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    
    .follower-name {
      font-weight: 600;
      color: #333;
      font-size: 1rem;
    }
    
    .follower-date {
      color: #666;
      font-size: 0.85rem;
      margin-top: 2px;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
    
    @media (max-width: 600px) {
      .dialog-header h2 {
        font-size: 1.2rem;
      }
      
      .follower-item {
        padding: 10px 16px;
      }
      
      .follower-avatar {
        width: 40px;
        height: 40px;
      }
    }
  `]
})
export class FollowersDialogComponent implements OnInit {
  userList: (Follower | Following)[] = [];
  isLoading = true;
  dialogTitle: string = '';
  emptyMessage: string = '';
  actionText: string = '';

  constructor(
    public dialogRef: MatDialogRef<FollowersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string; type: 'followers' | 'following' },
    private reactPostservice: ReactPostservice,
    private router: Router
  ) {
    this.setDialogProperties();
  }

  ngOnInit(): void {
    this.loadUserList();
  }

  setDialogProperties(): void {
    if (this.data.type === 'followers') {
      this.dialogTitle = 'ผู้ติดตาม';
      this.emptyMessage = 'ยังไม่มีผู้ติดตาม';
      this.actionText = 'ติดตาม';
    } else {
      this.dialogTitle = 'กำลังติดตาม';
      this.emptyMessage = 'ยังไม่ได้ติดตามใคร';
      this.actionText = 'ติดตาม';
    }
  }

  loadUserList(): void {
    this.isLoading = true;
    
    if (this.data.type === 'followers') {
      // เรียก API เพื่อดึงรายชื่อผู้ติดตามตาม userId ที่ระบุ
      this.reactPostservice.getFollowersByUserId(this.data.userId).subscribe(
        (response) => {
          console.log('Followers API response:', response);
          this.userList = response.followers_list || [];
          console.log('Processed userList:', this.userList);
          this.isLoading = false;
        },
        (error) => {
          console.error('Error loading followers:', error);
          this.isLoading = false;
        }
      );
    } else {
      // เรียก API เพื่อดึงรายชื่อผู้ที่ userId ระบุติดตาม
      this.reactPostservice.getFollowingByUserId(this.data.userId).subscribe(
        (response) => {
          console.log('Following API response:', response);
          this.userList = response.following_list || [];
          console.log('Processed userList:', this.userList);
          this.isLoading = false;
        },
        (error) => {
          console.error('Error loading following:', error);
          this.isLoading = false;
        }
      );
    }
  }

  getUserId(user: Follower | Following): string {
    if (this.data.type === 'followers') {
      return (user as Follower).following_id;
    } else {
      return (user as Following).followed_id;
    }
  }

  goToProfile(userId: string): void {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      // ตรวจสอบว่าเป็นโปรไฟล์ตัวเองหรือไม่
      if (userId === currentUserId) {
        // ถ้าเป็นโปรไฟล์ตัวเอง ให้ไปหน้า ProfileUser
        this.router.navigate(['/ProfileUser'], { 
          queryParams: { id: userId } 
        });
      } else {
        // ถ้าเป็นโปรไฟล์คนอื่น ให้ไปหน้า view_user
        this.router.navigate(['/view_user', currentUserId], { 
          queryParams: { Profileuser: userId } 
        });
      }
      this.closeDialog();
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
