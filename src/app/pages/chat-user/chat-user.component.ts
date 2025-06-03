import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chat-user',
  imports: [MatToolbarModule,MatButtonModule,RouterModule,MatCardModule,MatIconModule,CommonModule,
    MatTabsModule,],
  templateUrl: './chat-user.component.html',
  styleUrl: './chat-user.component.scss'
})
export class ChatUserComponent {
[x: string]: any;
newMessage: any;
@Input() userData: any; // หรือกำหนด type ให้ละเอียดก็ได้

}