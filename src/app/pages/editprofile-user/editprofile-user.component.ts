import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editprofile-user',
  imports: [MatButtonModule, RouterModule, CommonModule],
  templateUrl: './editprofile-user.component.html',
  styleUrls: ['./editprofile-user.component.scss'] // เปลี่ยน styleUrl เป็น styleUrls
})
export class EditprofileUserComponent {

}
