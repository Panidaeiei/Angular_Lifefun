import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-homepage-admin',
  imports: [MatToolbarModule, RouterModule, CommonModule],
  templateUrl: './homepage-admin.component.html',
  styleUrl: './homepage-admin.component.scss'
})
export class HomepageAdminComponent {
  userId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });
  }
  
}
