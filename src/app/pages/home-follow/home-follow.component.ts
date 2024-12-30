import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {MatToolbarModule} from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-home-follow',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatTabsModule ],
  templateUrl: './home-follow.component.html',
  styleUrl: './home-follow.component.scss'
})
export class HomeFollowComponent {
  userId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });
  }
}
