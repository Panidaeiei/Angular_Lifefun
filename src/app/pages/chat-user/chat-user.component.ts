import { CommonModule } from '@angular/common';
import { Component, Input, HostListener, OnInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule, Params, Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/Userservice';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chat-user',
  standalone: true,
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
  openedMenuId: string | null = null;
  isNotiDrawerOpen = true;

  // เพิ่มตัวแปรสำหรับเก็บ interval ID
  private chatRefreshInterval: any;
  
  // เพิ่ม cache สำหรับข้อมูลผู้ใช้เพื่อป้องกันการเรียก API ซ้ำ
  private userProfileCache: Map<string, any> = new Map();
  private fetchingUsers: Set<string> = new Set(); // ป้องกันการเรียก API ซ้ำสำหรับผู้ใช้เดียวกัน
  private deletedUsers: Set<string> = new Set(); // เก็บ user IDs ที่ถูกลบบัญชีแล้ว

  isMobile = false;
  isIPad = false;
  showSidebar = true;
  showUserInfo = true;
  originalChatList: any[] = [];
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

  // สำหรับป้องกันการส่งซ้ำ
  isSending: boolean = false;

  // สำหรับจัดการ scroll
  isUserScrolling: boolean = false;
  isNearBottom: boolean = true;

  @Input() userData: any;

  constructor(private route: ActivatedRoute, private userService: UserService, private chatService: ChatService, private router: Router) {}

  ngOnInit() {
    const loggedInUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!loggedInUserId || !token) {
      this.router.navigate(['/login'], { queryParams: { error: 'unauthorized' } });
      return;
    }
    this.route.queryParams.subscribe((params: Params) => {
      this.userId = String(params['id']);
      this.fromId = this.userId;
      
      if (this.userId) {
        this.loadUserChats();
        // รีเฟรชข้อมูลแชทที่มีอยู่แล้วแก้ไข other_user ที่ขาดหายไป
        this.chatService.refreshChatUserData(this.userId);
      }
    });
    
    this.checkScreenSize();
    
    // ตั้งค่าให้แชทเริ่มต้นที่ด้านล่างเสมอ
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);

    // เพิ่มการรีเฟรชแชทอัตโนมัติทุก 60 วินาที (เพิ่มจาก 30 วินาทีเพื่อลดการเรียก API)
    this.chatRefreshInterval = setInterval(() => {
      if (this.userId) {
        this.loadUserChats();
      }
    }, 60000);
  }

  ngOnDestroy() {
    // หยุดการรีเฟรชแชทอัตโนมัติ
    if (this.chatRefreshInterval) {
      clearInterval(this.chatRefreshInterval);
    }
  }

  // ฟังก์ชันประมวลผลแชทพร้อมข้อมูลผู้ใช้
  private async processChatsWithUserProfiles(validChats: any[]): Promise<any[]> {
    // รวบรวม user IDs ที่ต้องดึงข้อมูล
    const userIdsToFetch = new Set<string>();
    
    validChats.forEach(chat => {
      const otherUserId = chat.other_user || chat.other_user_id || chat.uid || chat.other_id || chat.user_id || chat.id;
      let targetUserId = otherUserId;
      
      if (!targetUserId && chat.chatId) {
        const chatIdParts = chat.chatId.split('_');
        if (chatIdParts.length === 2) {
          targetUserId = chatIdParts[1] === this.userId ? chatIdParts[0] : chatIdParts[1];
        }
      }
      
      console.log('🔍 Chat:', chat.chatId, 'Target User ID:', targetUserId, 'Username:', chat.other_username || chat.username);
      
      if (targetUserId && targetUserId !== this.userId && !this.userProfileCache.has(targetUserId)) {
        userIdsToFetch.add(targetUserId);
      }
    });
    
    // ดึงข้อมูลผู้ใช้ทั้งหมดที่จำเป็นในครั้งเดียว
    if (userIdsToFetch.size > 0) {
      const userIdsArray = Array.from(userIdsToFetch);
      console.log('📤 Sending user IDs to API:', userIdsArray);
      try {
        // ใช้ batch API แทนการเรียกทีละคน
        const userProfiles = await this.userService.getUsersBatch(userIdsArray).toPromise();
        
        if (userProfiles) {
          console.log('📋 All user profiles received:', userProfiles);
          
          // ตรวจสอบ User IDs ที่ส่งไปแต่ไม่ได้รับกลับมา (ถูกลบจากฐานข้อมูล)
          const receivedUserIds = userProfiles.map(p => (p as any).uid?.toString()).filter(Boolean);
          const missingUserIds = userIdsArray.filter(id => !receivedUserIds.includes(id));
          
          if (missingUserIds.length > 0) {
            console.log('❌ Users not found in database (deleted):', missingUserIds);
            missingUserIds.forEach(userId => {
              this.deletedUsers.add(userId);
            });
          }
          
          // บันทึกลง cache และตรวจสอบสถานะบัญชี
          userProfiles.forEach(userProfile => {
            if (userProfile && (userProfile as any).uid) {
              const userId = (userProfile as any).uid.toString();
              this.userProfileCache.set(userId, userProfile);
              
              // ตรวจสอบสถานะบัญชี
              const accountStatus = (userProfile as any).account_status;
              console.log('🔍 User ID:', userId, 'Account Status:', accountStatus);
              
              if (accountStatus === 'banned' || accountStatus === 'inactive') {
                this.deletedUsers.add(userId);
                console.log('❌ User added to deleted list:', userId);
              } else {
                this.deletedUsers.delete(userId);
                console.log('✅ User is active:', userId);
              }
            }
          });
          
          // อัปเดต Firebase สำหรับผู้ใช้ที่ดึงมา
          userProfiles.forEach((userProfile) => {
            if (userProfile && (userProfile as any).uid) {
              const userId = (userProfile as any).uid.toString();
              const chat = validChats.find(c => {
                const otherUserId = c.other_user || c.other_user_id || c.uid || c.other_id || c.user_id || c.id;
                let targetUserId = otherUserId;
                if (!targetUserId && c.chatId) {
                  const chatIdParts = c.chatId.split('_');
                  if (chatIdParts.length === 2) {
                    targetUserId = chatIdParts[1] === this.userId ? chatIdParts[0] : chatIdParts[1];
                  }
                }
                return targetUserId === userId;
              });
              
              if (chat) {
                this.chatService.updateChatUserInfo(chat.chatId, this.userId, {
                  username: userProfile.username || '',
                  image_url: userProfile.image_url || ''
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      }
    }
    
    // ประมวลผลแชทด้วยข้อมูลที่ดึงมาแล้ว
    const processedChats = validChats.map((chat) => {
      const otherUserId = chat.other_user || chat.other_user_id || chat.uid || chat.other_id || chat.user_id || chat.id;
      
      let username = chat.other_username || chat.username;
      let avatar = chat.other_image_url || chat.image_url;
      let targetUserId = otherUserId;
      
      if (!username || !avatar) {
        if (!targetUserId && chat.chatId) {
          const chatIdParts = chat.chatId.split('_');
          if (chatIdParts.length === 2) {
            targetUserId = chatIdParts[1] === this.userId ? chatIdParts[0] : chatIdParts[1];
          }
        }
        
      if (targetUserId && targetUserId !== this.userId) {
        // ตรวจสอบสถานะบัญชีก่อน (ถูกลบจากฐานข้อมูล)
        if (this.deletedUsers.has(targetUserId)) {
          username = 'บัญชีผู้ใช้งาน';
          avatar = 'https://i.pinimg.com/736x/a8/0e/36/a80e3690318c08114011145fdcfa3ddb.jpg';
          console.log('❌ User marked as deleted:', targetUserId);
        } else {
          const userProfile = this.userProfileCache.get(targetUserId);
          if (userProfile) {
            username = userProfile.username || `User_${targetUserId}`;
            avatar = userProfile.image_url || 'https://i.pinimg.com/736x/a8/0e/36/a80e3690318c08114011145fdcfa3ddb.jpg';
          } else {
            username = username || `User_${targetUserId}`;
            avatar = avatar || 'https://i.pinimg.com/736x/a8/0e/36/a80e3690318c08114011145fdcfa3ddb.jpg';
          }
        }
      } else {
        username = username || `User_${chat.chatId}`;
        avatar = avatar || 'https://i.pinimg.com/736x/a8/0e/36/a80e3690318c08114011145fdcfa3ddb.jpg';
      }
      }
      
      const mapped = {
        avatar: avatar,
        name: username,
        lastMessage: chat.last_message || 'ยังไม่มีข้อความ',
        chatId: chat.chatId,
        lastMessageTime: chat.last_message_time || new Date().toISOString(),
        lastMessageSenderId: String(chat.last_message_sender_id || ''),
        lastMessageSenderName: chat.last_message_sender_name || username,
        uid: otherUserId || chat.chatId,
        isDeleted: this.deletedUsers.has(targetUserId || ''),
        ...chat
      };
      
      if (mapped.lastMessageSenderId === this.userId) {
        mapped.lastMessageSenderName = 'คุณ';
      } else if (mapped.lastMessageSenderId === otherUserId) {
        mapped.lastMessageSenderName = username;
      } else if (mapped.lastMessageSenderId && mapped.lastMessageSenderId !== this.userId) {
        mapped.lastMessageSenderName = username;
      }
      
      return mapped;
    });
    
    return processedChats;
  }

  // เพิ่ม method สำหรับดึงข้อมูลผู้ใช้แบบมี cache
  private async fetchUserProfileWithCache(userId: string): Promise<any> {
    // ตรวจสอบ cache ก่อน
    if (this.userProfileCache.has(userId)) {
      return this.userProfileCache.get(userId);
    }
    
    // ตรวจสอบว่ากำลังดึงข้อมูลผู้ใช้นี้อยู่หรือไม่
    if (this.fetchingUsers.has(userId)) {
      // รอจนกว่าจะดึงเสร็จ
      return new Promise((resolve) => {
        const checkCache = () => {
          if (this.userProfileCache.has(userId)) {
            resolve(this.userProfileCache.get(userId));
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }
    
    // เพิ่ม userId เข้า fetchingUsers เพื่อป้องกันการเรียกซ้ำ
    this.fetchingUsers.add(userId);
    
    try {
      return new Promise((resolve, reject) => {
        this.userService.getUserById(userId).subscribe({
          next: (userProfile: any) => {
            if (userProfile) {
              // บันทึกลง cache
              this.userProfileCache.set(userId, userProfile);
            }
            this.fetchingUsers.delete(userId);
            resolve(userProfile);
          },
          error: (error: any) => {
            this.fetchingUsers.delete(userId);
            reject(error);
          }
        });
      });
    } catch (error) {
      this.fetchingUsers.delete(userId);
      throw error;
    }
  }

loadUserChats() {
  // ใช้ real-time listener แทนการดึงข้อมูลครั้งเดียว
  this.chatService.listenUserChats(this.userId, (chats) => {
    // console.log('🔍 Current userId:', this.userId);
    // console.log('📋 All chats received:', chats);
    
    // ตรวจสอบให้แน่ใจว่าแชทที่แสดงเป็นของ user นี้จริงๆ
    const validChats = chats.filter(chat => {
      // ตรวจสอบว่ามีข้อมูลแชทครบถ้วนหรือไม่
      const hasChatId = !!chat.chatId;
      const hasLastMessage = chat.last_message !== undefined;
      const hasLastMessageTime = chat.last_message_time !== undefined;
      
      // ตรวจสอบว่า chatId มี userId นี้อยู่จริงหรือไม่
      const chatIdContainsUserId = chat.chatId && chat.chatId.includes(this.userId);
      
      // ตรวจสอบว่า user นี้มีข้อความในแชทนี้หรือไม่ (ตรวจสอบจาก last_message_sender_id เท่านั้น)
      const hasUserMessages = chat.last_message_sender_id === this.userId;
      
      // ตรวจสอบว่า user นี้เป็นผู้รับข้อความหรือไม่ (ข้อความล่าสุดส่งมาหา user นี้)
      const isUserReceiver = chat.last_message_sender_id && chat.last_message_sender_id !== this.userId;
      
      // console.log('🔍 Chat ID:', chat.chatId, 'Contains userId?', chatIdContainsUserId);
      // console.log('🔍 Has user messages?', hasUserMessages);
      // console.log('🔍 Is user receiver?', isUserReceiver);
      // console.log('🔍 Last message sender ID:', chat.last_message_sender_id);
      
      // แสดงแชทถ้ามี chatId และเป็นแชทของ user นี้จริงๆ และ (user นี้มีข้อความในแชท หรือ user นี้เป็นผู้รับข้อความ)
      return hasChatId && chatIdContainsUserId && (hasUserMessages || isUserReceiver);
    });
    
    
    // เก็บ chatId เดิมเพื่อตรวจสอบแชทใหม่
    const previousChatIds = this.chatList.map(chat => chat.chatId);

    // ใช้ async/await เพื่อรอให้ข้อมูลผู้ใช้โหลดเสร็จก่อน
    this.processChatsWithUserProfiles(validChats).then(processedChats => {
      this.chatList = processedChats;
      this.originalChatList = [...this.chatList];
      
      // ตรวจสอบแชทใหม่
      const newChatIds = this.chatList.map(chat => chat.chatId);
      const hasNewChats = newChatIds.some(chatId => !previousChatIds.includes(chatId));
      
      if (hasNewChats) {
        // บังคับให้ Angular ตรวจสอบการเปลี่ยนแปลง
        setTimeout(() => {
          this.chatList = [...this.chatList];
          this.originalChatList = [...this.chatList];
        }, 0);
      }
      
      // เลือกแชทแรกโดยอัตโนมัติ
      if (this.chatList.length > 0 && !this.selectedChat) {
        this.selectChat(this.chatList[0]);
      }
    });
  });
}

  async deleteChat(chatId: string) {
    if (!chatId) return;
    if (!confirm('คุณต้องการลบห้องแชทนี้ทั้งหมดใช่หรือไม่? ข้อความที่และรูปถาพที่ส่งจะถูกลบออกด้วย')) return;
    await this.chatService.removeChatFromUser(this.userId, chatId);
    await this.chatService.deleteEntireChat(chatId); // <-- ลบทั้งห้องแชท
    
    if (this.selectedChat && this.selectedChat.chatId === chatId) {
      this.selectedChat = null;
      this.currentChatMessages = [];
    }
  }
 
  toggleChatMenu(chatId: string) {
    if (this.openedMenuId === chatId) {
      this.openedMenuId = null;
    } else {
      this.openedMenuId = chatId;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // ปิดเมนูถ้าคลิกนอกปุ่มเมนู
    const target = event.target as HTMLElement;
    if (!target.closest('.chat-menu-wrapper')) {
      this.openedMenuId = null;
    }
  }

  selectChat(chat: any) {
    this.selectedChat = chat;
    this.chatId = chat.chatId;
    
    // รีเซ็ต scroll state
    this.isNearBottom = true;
    this.isUserScrolling = false;
    
    // ดึงข้อความจาก Firebase แบบ real-time
    this.chatService.listenMessages(chat.chatId, (messages) => {
      const previousLength = this.currentChatMessages.length;
      this.currentChatMessages = messages;
      
      if (previousLength === 0) {
        // เริ่มที่ข้อความล่าสุดเลย
        setTimeout(() => {
          const chatMessages = document.querySelector('.chat-messages');
          if (chatMessages) {
            // ตั้งค่าให้เริ่มที่ล่างสุดทันที
            chatMessages.scrollTop = chatMessages.scrollHeight;
            this.isNearBottom = true;
            this.isUserScrolling = false;
          }
        }, 100);
      } else if (messages.length > previousLength && this.isNearBottom && !this.isUserScrolling) {
        // มีข้อความใหม่และผู้ใช้อยู่ใกล้ด้านล่าง - เลื่อนไปล่าสุด
        setTimeout(() => {
          this.scrollToBottomForNewMessage();
        }, 100);
      }
    });
    
    // สำหรับ mobile เท่านั้น ให้ซ่อน sidebar
    if (this.isMobile) {
      this.showSidebar = false;
    }
  }

  async sendMessage() {
    // ป้องกันการส่งซ้ำ
    if (this.isSending) {
      return;
    }
    
    // ตรวจสอบสถานะบัญชีผู้ใช้ที่แชทด้วย
    if (this.selectedChat && this.selectedChat.isDeleted) {
      alert('ไม่สามารถส่งข้อความได้ เนื่องจากบัญชีผู้ใช้ถูกระงับหรือไม่สามารถใช้งานได้');
      return;
    }
    
    if ((!this.newMessage.trim() && !this.chatImage && !this.chatVideo) || !this.chatId) return;
    
    // ตั้งค่ากำลังส่ง
    this.isSending = true;
    
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
      
      // เลื่อนไปที่ข้อความล่าสุดหลังจากส่งข้อความ
      setTimeout(() => {
        this.scrollToBottomForNewMessage();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // ถ้าเกิด error ให้ลบ pending message ออก
      if (pendingMsg) {
        const index = this.currentChatMessages.findIndex(msg => msg.pending && msg.create_at === pendingMsg.create_at);
        if (index !== -1) {
          this.currentChatMessages.splice(index, 1);
        }
      }
    } finally {
      // รีเซ็ตสถานะการส่งเสมอ
      this.isSending = false;
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
    // รีเซ็ต scroll position เมื่อ orientation เปลี่ยน
    setTimeout(() => {
      this.scrollToBottom();
    }, 300);
  }

  @HostListener('window:orientationchange')
  onOrientationChange() {
    // รอให้ orientation เปลี่ยนเสร็จแล้วค่อยปรับ layout
    setTimeout(() => {
      this.checkScreenSize();
      this.scrollToBottom();
    }, 500);
  }

checkScreenSize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  // ตรวจสอบว่าเป็น iPad หรือไม่
  this.isIPad = /iPad/.test(navigator.userAgent) || 
                 (w >= 768 && w <= 1230) || 
                 (w >= 1024 && w <= 1366 && h <= 1024);
  
  // ตั้งค่า mobile สำหรับมือถือเท่านั้น (≤ 600px)
  this.isMobile = w <= 600;
  
  // ตั้งค่าการแสดง UI ตามโหมด
  if (this.isMobile) {
    // สำหรับมือถือเท่านั้น
    this.showSidebar = false;
    this.showUserInfo = false;
  } else if (this.isIPad) {
    // สำหรับ iPad ให้ใช้ UI แบบมือถือ (ซ่อน sidebar)
    this.showSidebar = false;
    this.showUserInfo = false;
  } else {
    // สำหรับ desktop
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
      // ค้นหาโดยไม่ต้องรีเฟรชแชท
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

  scrollToBottom() {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      // ใช้ requestAnimationFrame เพื่อให้แน่ใจว่า DOM อัปเดตเสร็จแล้ว
      requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // อัปเดต scroll state
        this.isNearBottom = true;
        this.isUserScrolling = false;
      });
    }
  }

  // Method สำหรับเมื่อมีข้อความใหม่
  scrollToBottomForNewMessage() {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      // ใช้ requestAnimationFrame เพื่อให้แน่ใจว่า DOM อัปเดตเสร็จ
      requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        this.isNearBottom = true;
      });
    }
  }

  // ตรวจสอบว่าผู้ใช้อยู่ใกล้ด้านล่างหรือไม่
  checkIfNearBottom(): boolean {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessages;
      const threshold = 150; // เพิ่มระยะห่างจากด้านล่างสำหรับ iPad
      return scrollHeight - scrollTop - clientHeight < threshold;
    }
    return true;
  }

  // จัดการ scroll event
  onChatScroll() {
    this.isUserScrolling = true;
    this.isNearBottom = this.checkIfNearBottom();
    
    // รีเซ็ต flag หลังจากผู้ใช้หยุด scroll
    setTimeout(() => {
      this.isUserScrolling = false;
    }, 200); // เพิ่มเวลาให้แน่ใจว่าผู้ใช้หยุด scroll แล้ว
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUserId');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('currentUserId');
    this.router.navigate(['/login']);
    // ลบ cache ทั้งหมดที่เกี่ยวข้องกับผู้ใช้ที่ออกจากระบบ
    this.userProfileCache.clear();
    this.fetchingUsers.clear();
    this.deletedUsers.clear();
  }


}