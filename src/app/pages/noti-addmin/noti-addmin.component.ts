import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ReactPostservice } from '../../services/ReactPostservice';
import { MatBadgeModule } from '@angular/material/badge';


@Component({
  selector: 'app-noti-addmin',
  imports: [MatToolbarModule, RouterModule, CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatBadgeModule],
  templateUrl: './noti-addmin.component.html',
  styleUrl: './noti-addmin.component.scss'
})
export class NotiAddminComponent {

  userId: string = '';
  isDrawerOpen: boolean = false;
  selectedCard: any = null; 
  isNotiDrawerOpen = true;
  reportNotifications: any[] = [];
  reportCount: number = 0;
  latestReporterName: string = '';

  constructor(private route: ActivatedRoute, private notificationService: ReactPostservice) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });

    this.loadReportNotifications();
  }

  loadReportNotifications(): void {
    this.notificationService.Noti_Reportaddmin().subscribe({
      next: (data) => {
        this.reportNotifications = data.reports;
        this.reportCount = this.reportNotifications.length;

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
}
