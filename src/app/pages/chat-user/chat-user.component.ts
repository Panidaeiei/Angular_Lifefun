import { CommonModule } from '@angular/common';
import { Component, Input, HostListener, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule, Params } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/Userservice';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-user',
  imports: [MatToolbarModule, MatButtonModule, RouterModule, MatCardModule, MatIconModule, CommonModule, MatBadgeModule,
    MatTabsModule, FormsModule],
  templateUrl: './chat-user.component.html',
  styleUrl: './chat-user.component.scss'
})
export class ChatUserComponent implements OnInit, OnDestroy {
  [x: string]: any;
  userId: string = '';
  newMessage: string = '';
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
  chatList: any[] = [];
  selectedChat: any = null;
  isDrawerOpenMobile: boolean = false;
  chatId: string = '';
  fromId: string = '';
  currentChatMessages: any[] = [];
  
  // เพิ่มตัวแปรสำหรับไฟล์ที่เลือก
  chatImage: File | null = null;
  chatVideo: File | null = null;
  selectedFilePreview: string | null = null;

  // สำหรับ hover bubble
  hoveredMsgIndex: number | null = null;

  @Input() userData: any;

  constructor(private route: ActivatedRoute, private userService: UserService, private chatService: ChatService) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.userId = String(params['id']);
      this.fromId = this.userId;
      console.log('User ID:', this.userId);
      
      if (this.userId) {
        this.loadUserChats();
      }
    });
    
    this.checkScreenSize();
  }

  ngOnDestroy() {
    // Cleanup subscriptions if needed
  }

  loadUserChats() {
    this.chatService.getUserChats(this.userId, (chats) => {
      this.chatList = chats.map(chat => {
        const mapped = {
          avatar: chat.other_image_url,
          name: chat.other_username,
          lastMessage: chat.last_message || '',
          chatId: chat.chatId,
          lastMessageTime: chat.last_message_time,
          lastMessageSenderId: String(chat.last_message_sender_id || ''),
          lastMessageSenderName: chat.last_message_sender_name || chat.other_username,
          ...chat
        };
        // DEBUG LOG
        console.log('[DEBUG chatList]', {
          userId: this.userId,
          chatId: mapped.chatId,
          lastMessage: mapped.lastMessage,
          lastMessageSenderId: mapped.lastMessageSenderId,
          lastMessageSenderName: mapped.lastMessageSenderName
        });
        return mapped;
      });
      this.originalChatList = [...this.chatList];
      
      // เลือกแชทแรกโดยอัตโนมัติ
      if (this.chatList.length > 0 && !this.selectedChat) {
        this.selectChat(this.chatList[0]);
      }
    });
  }

  selectChat(chat: any) {
    this.selectedChat = chat;
    this.chatId = chat.chatId;
    
    // ดึงข้อความจาก Firebase แบบ real-time
    this.chatService.listenMessages(chat.chatId, (messages) => {
      this.currentChatMessages = messages;
    });
    
    if (this.isMobile) {
      this.showSidebar = false;
    }
  }

  async sendMessage() {
    if ((!this.newMessage.trim() && !this.chatImage && !this.chatVideo) || !this.chatId) return;
    
    let pendingMsg: any = null;
    if (this.chatImage) {
      pendingMsg = {
        uid: this.userId,
        text: this.newMessage,
        image_url: this.selectedFilePreview,
        type: 2,
        create_at: Date.now(),
        pending: true
      };
      // เพิ่ม pending message ทันที
      this.currentChatMessages.push(pendingMsg);
    } else if (this.chatVideo) {
      pendingMsg = {
        uid: this.userId,
        text: this.newMessage,
        video_url: this.selectedFilePreview,
        type: 3,
        create_at: Date.now(),
        pending: true
      };
      // เพิ่ม pending message ทันที
      this.currentChatMessages.push(pendingMsg);
    }
    
    try {
      let imageUrl = '';
      let videoUrl = '';
      
      // อัปโหลดไฟล์ถ้ามี
      if (this.chatImage) {
        imageUrl = await this.chatService.uploadImage(this.chatImage, this.chatId, this.userId);
      }
      if (this.chatVideo) {
        videoUrl = await this.chatService.uploadVideo(this.chatVideo, this.chatId, this.userId);
      }
      
      // ส่งข้อความพร้อมไฟล์
      await this.chatService.sendMessage(
        this.chatId,
        this.userId,
        this.newMessage,
        imageUrl,
        videoUrl,
        this.userData?.username || ''
      );
      // รีโหลด chat list หลังส่งข้อความใหม่
      this.loadUserChats();
      
      // ลบ pending message ออก (เพราะ Firebase จะส่ง message จริงมาแล้ว)
      if (pendingMsg) {
        const index = this.currentChatMessages.findIndex(msg => msg.pending && msg.create_at === pendingMsg.create_at);
        if (index !== -1) {
          this.currentChatMessages.splice(index, 1);
        }
      }
      
      // รีเซ็ตตัวแปร
      this.newMessage = '';
      this.chatImage = null;
      this.chatVideo = null;
      this.selectedFilePreview = null;
    } catch (error) {
      console.error('Error sending message:', error);
      // ถ้าเกิด error ให้ลบ pending message ออก
      if (pendingMsg) {
        const index = this.currentChatMessages.findIndex(msg => msg.pending && msg.create_at === pendingMsg.create_at);
        if (index !== -1) {
          this.currentChatMessages.splice(index, 1);
        }
      }
    }
  }

  onChatFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    // ลบไฟล์เก่า
    this.chatImage = null;
    this.chatVideo = null;
    this.selectedFilePreview = null;

    if (file.type.startsWith('image/')) {
      this.chatImage = file;
      this.createFilePreview(file);
    } else if (file.type.startsWith('video/')) {
      this.chatVideo = file;
      this.createFilePreview(file);
    }
  }

  createFilePreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedFilePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile() {
    this.chatImage = null;
    this.chatVideo = null;
    this.selectedFilePreview = null;
  }

  getFileSize(): string {
    const file = this.chatImage || this.chatVideo;
    if (file && file.size) {
      return (file.size / 1024 / 1024).toFixed(2) + ' MB';
    }
    return '0 MB';
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 910;
    if (this.isMobile) {
      this.showSidebar = true;
      this.showUserInfo = false;
    } else {
      this.showSidebar = true;
      this.showUserInfo = true;
    }
  }

  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  selectCard(cardData: any) {
    this.selectedCard = cardData;
    this.isNotiDrawerOpen = false;
  }

  searchChats() {
    if (!this.searchQuery.trim()) {
      this.chatList = [...this.originalChatList];
    } else {
      this.chatList = this.originalChatList.filter(chat => 
        chat.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (chat.lastMessage && chat.lastMessage.toLowerCase().includes(this.searchQuery.toLowerCase()))
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
}