import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profileuser-admin',
  imports: [MatToolbarModule,RouterModule,CommonModule,MatIconModule,MatTabsModule],
  templateUrl: './profileuser-admin.component.html',
  styleUrl: './profileuser-admin.component.scss'
})
export class ProfileuserAdminComponent {

}