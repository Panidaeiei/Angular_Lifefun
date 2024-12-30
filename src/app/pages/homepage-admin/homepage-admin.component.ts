import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-homepage-admin',
  imports: [],
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
