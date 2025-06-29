import { CommonModule } from '@angular/common';
import { Component, Input, HostListener, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule, Params } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/Userservice';

@Component({
  selector: 'app-chat-user',
  imports: [MatToolbarModule, MatButtonModule, RouterModule, MatCardModule, MatIconModule, CommonModule, MatBadgeModule,
    MatTabsModule, FormsModule],
  templateUrl: './chat-user.component.html',
  styleUrl: './chat-user.component.scss'
})
export class ChatUserComponent implements OnInit {
  [x: string]: any;
  userId: string = '';
  newMessage: any;
  searchQuery: string = '';
  isDrawerOpen: boolean = false;
  selectedCard: any = null; 
  isNotiDrawerOpen = true;
  selectedChatUser: any = {
  name: 'วาสันต์',
  image: 'https://i.imgur.com/QrKdv2k.png'
};

  isMobile = false;
  showSidebar = true;
  showUserInfo = true;
  originalChatList: any[] = [];
  stories = [
    { image: 'https://randomuser.me/api/portraits/women/1.jpg', name: 'สตอรี่1' },
    { image: 'https://randomuser.me/api/portraits/men/2.jpg', name: 'สตอรี่2' },
    { image: 'https://randomuser.me/api/portraits/women/3.jpg', name: 'สตอรี่3' }
  ];
  chatList = [
    {
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      name: 'A',
      lastMessage: 'สวัสดี',
      messages: [
        { text: 'สวัสดี', isMine: false },
        { text: 'ดีจ้า', isMine: true }
      ],
      status: 'ออนไลน์'
    },
    {
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      name: 'B',
      lastMessage: 'Hello',
      messages: [
        { text: 'Hello', isMine: false },
        { text: 'Hi!', isMine: true }
      ],
      status: 'ออฟไลน์'
    }
  ];
  selectedChat: any = null;
  isDrawerOpenMobile: boolean = false;
  chatId: string = '';
  fromId: string = '';

  @Input() userData: any; // หรือกำหนด type ให้ละเอียดก็ได้

  constructor(private route: ActivatedRoute,private userService: UserService) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.userId = params['id']; // ดึง ID จาก Query Parameters
      console.log('User ID:', this.userId);

    });
    
    this.checkScreenSize();
    // เก็บรายการแชทต้นฉบับ
    this.originalChatList = [...this.chatList];
    // เลือกแชทแรกโดยอัตโนมัติ
    if (this.chatList.length > 0) {
      this.selectedChat = this.chatList[0];
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <=910;
    if (this.isMobile) {
      this.showSidebar = true;
      this.showUserInfo = false;
    } else {
      this.showSidebar = true;
      this.showUserInfo = true;
    }
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen; // สลับสถานะเปิด/ปิด
  }

  selectCard(cardData: any) {
    this.selectedCard = cardData;
    this.isNotiDrawerOpen = false;

  }

  selectChat(chat: any) {
    this.selectedChat = chat;
    if (this.isMobile) {
      this.showSidebar = false;
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    const formData = new FormData();
    formData.append('chatId', this.chatId);
    formData.append('uid', this.fromId);
    formData.append('text', this.newMessage);
    formData.append('type', '1'); // 1 = ข้อความ, 2 = รูป

    this.userService.sendMessage(formData).subscribe(res => {
      this.newMessage = '';
      // ไม่ต้องโหลดใหม่ เพราะ subscribe ข้อความอยู่แล้ว
    });
  }

  searchChats() {
    if (!this.searchQuery.trim()) {
      // ถ้าไม่มีคำค้นหา ให้แสดงรายการทั้งหมด
      this.chatList = [...this.originalChatList];
    } else {
      // ค้นหาจากชื่อหรือข้อความล่าสุด
      this.chatList = this.originalChatList.filter(chat => 
        chat.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }

  onMobileChatSelect(chat: any) {
    this.selectedChat = chat;
  }

  openMobileDrawer() {
    this.isDrawerOpenMobile = true;
  }

  closeMobileDrawer() {
    this.isDrawerOpenMobile = false;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('chatId', this.chatId);
    formData.append('uid', this.fromId);
    formData.append('type', '2'); // 2 = รูป
    formData.append('image', file);

    this.userService.sendMessage(formData).subscribe(res => {
      // ไม่ต้องโหลดใหม่ เพราะ subscribe ข้อความอยู่แล้ว
    });
  }
}