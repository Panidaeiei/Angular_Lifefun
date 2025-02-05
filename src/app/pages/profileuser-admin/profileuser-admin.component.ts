import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profileuser-admin',
  imports: [MatToolbarModule,RouterModule,CommonModule],
  templateUrl: './profileuser-admin.component.html',
  styleUrl: './profileuser-admin.component.scss'
})
export class ProfileuserAdminComponent {

}