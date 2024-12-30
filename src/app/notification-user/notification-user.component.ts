import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-notification-user',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule ],
  templateUrl: './notification-user.component.html',
  styleUrl: './notification-user.component.scss'
})
export class NotificationUserComponent {

  userId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });
  }
}
