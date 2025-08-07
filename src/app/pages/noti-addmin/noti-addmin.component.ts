import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ReactPostservice } from '../../services/ReactPostservice';
import { MatBadgeModule } from '@angular/material/badge';
import { AdminNotificationService, AdminNotificationCounts } from '../../services/admin-notification.service';
import { Subscription } from 'rxjs';
import { FormatLocalTimePipe } from '../../pipes/time-ago.pipe';


@Component({
  selector: 'app-noti-addmin',
  standalone: true,
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatBadgeModule, FormatLocalTimePipe],
  templateUrl: './noti-addmin.component.html',
  styleUrl: './noti-addmin.component.scss'
})
export class NotiAddminComponent implements OnDestroy {

  userId: string = '';
  isDrawerOpen: boolean = false;
  selectedCard: any = null; 
  isNotiDrawerOpen = true;
  reportNotifications: any[] = [];
  reportCount: number = 0;
  latestReporterName: string = '';
  notificationCounts: AdminNotificationCounts = {
    report: 0,
    total: 0
  };
  private notificationSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute, 
    private notificationService: ReactPostservice, 
    private router: Router,
    private adminNotificationService: AdminNotificationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });

    this.loadReportNotifications();
    
    // เริ่มการติดตามการแจ้งเตือน
    this.startNotificationTracking();
  }

  // เริ่มการติดตามการแจ้งเตือน
  private startNotificationTracking(): void {
    if (this.userId) {
      // โหลดการแจ้งเตือนครั้งแรก
      this.adminNotificationService.loadNotificationCounts(this.userId);
      
      // เริ่มการอัปเดตอัตโนมัติ
      this.adminNotificationService.startAutoUpdate(this.userId);
      
      // ติดตามการเปลี่ยนแปลงจำนวนการแจ้งเตือน
      this.notificationSubscription = this.adminNotificationService.notificationCounts.subscribe(
        (counts) => {
          this.notificationCounts = counts;
          console.log('Admin notification counts updated:', counts);
        }
      );
    }
  }

  loadReportNotifications(): void {
    this.notificationService.Noti_Reportaddmin().subscribe({
      next: (data) => {
        this.reportNotifications = data.reports;
        this.reportCount = this.reportNotifications.length;

        // อัปเดต notification counts จากข้อมูลที่มี
        this.notificationCounts = {
          report: this.reportCount,
          total: this.reportCount
        };

        if (this.reportCount > 0) {
          this.latestReporterName = this.reportNotifications[0].username;
        } else {
          this.latestReporterName = '';
        }
      },
      error: (err) => {
        console.error('Error loading report notifications:', err);
      }
    });
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  toggleNotiDrawer() {
    this.isNotiDrawerOpen = !this.isNotiDrawerOpen;
  }

  selectCard(cardData: any) {
    this.selectedCard = cardData;
    this.isNotiDrawerOpen = false;
  }

  logout() {
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminRole');
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminId');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminToken');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    // หยุดการติดตามการแจ้งเตือน
    this.adminNotificationService.stopAutoUpdate();
    
    // ยกเลิก subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }
}
