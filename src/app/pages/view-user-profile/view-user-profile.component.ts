import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-view-user-profile',
  imports: [],
  templateUrl: './view-user-profile.component.html',
  styleUrl: './view-user-profile.component.scss'
})
export class ViewUserProfileComponent {

  constructor(private route: ActivatedRoute) { }

  userId: string = '';

  ngOnInit(): void {
    // ดึงค่าจาก Query Parameters
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.userId = params['id'];
        console.log('User ID:', this.userId);
      } else {
        this.userId = ''; // กำหนดค่าเริ่มต้นเมื่อไม่มี User ID
        console.warn('User ID not found in query parameters.');
      }
    });
  }
}
