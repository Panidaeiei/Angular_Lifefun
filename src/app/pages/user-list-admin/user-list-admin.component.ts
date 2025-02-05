import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { ActivatedRoute  } from '@angular/router';
@Component({
  selector: 'app-user-list-admin',
  imports: [CommonModule,MatToolbarModule,RouterModule,MatToolbarModule],
  templateUrl: './user-list-admin.component.html',
  styleUrl: './user-list-admin.component.scss'
})
export class UserListAdminComponent {
[x: string]: any;

}
