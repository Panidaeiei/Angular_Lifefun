import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-cache-manager',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <span>Cache Manager</span>
    </mat-toolbar>
    
    <div style="padding: 20px;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Local Storage Cache Management</mat-card-title>
          <mat-card-subtitle>จัดการข้อมูล cache ที่เก็บไว้ใน localStorage</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div style="margin-bottom: 20px;">
            <h3>ข้อมูล Cache ที่มีอยู่:</h3>
            <div *ngFor="let cache of cacheInfo" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
              <strong>{{ cache.key }}</strong><br>
              ขนาด: {{ cache.size }} bytes<br>
              อายุ: {{ cache.age }} นาที<br>
              <button mat-raised-button color="warn" (click)="clearCache(cache.key)" style="margin-top: 5px;">
                ลบ Cache
              </button>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <button mat-raised-button color="primary" (click)="clearAllCache()" style="margin-right: 10px;">
              ลบ Cache ทั้งหมด
            </button>
            <button mat-raised-button color="accent" (click)="refreshCacheInfo()">
              รีเฟรชข้อมูล
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .cache-info {
      margin: 10px 0;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  `]
})
export class CacheManagerComponent {
  cacheInfo: Array<{key: string, size: number, age: number}> = [];

  ngOnInit() {
    this.refreshCacheInfo();
  }

  refreshCacheInfo() {
    this.cacheInfo = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('user_profile_') || key.startsWith('user_posts_') || 
                  key.startsWith('search_results_') || key.startsWith('follow_count_'))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            const size = new Blob([value]).size;
            const age = Math.floor((now - parsed.timestamp) / (1000 * 60)); // นาที
            
            this.cacheInfo.push({
              key: key,
              size: size,
              age: age
            });
          }
        } catch (error) {
          console.error('Error parsing cache:', key, error);
        }
      }
    }

    // เรียงตามอายุ (ใหม่สุดก่อน)
    this.cacheInfo.sort((a, b) => a.age - b.age);
  }

  clearCache(key: string) {
    localStorage.removeItem(key);
    this.refreshCacheInfo();
    console.log('Cleared cache:', key);
  }

  clearAllCache() {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('user_profile_') || key.startsWith('user_posts_') || 
                  key.startsWith('search_results_') || key.startsWith('follow_count_'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    this.refreshCacheInfo();
    console.log('Cleared all cache entries');
  }
} 