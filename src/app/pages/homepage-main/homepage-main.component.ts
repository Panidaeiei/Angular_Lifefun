import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-homepage-main',
  imports: [MatToolbarModule, RouterModule, CommonModule],
  templateUrl: './homepage-main.component.html',
  styleUrl: './homepage-main.component.scss'
})
export class HomepageMainComponent {
  userId: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);
    });
  }
}
