import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, DataSnapshot, update, get, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private app = initializeApp(environment.firebase);
  private db = getDatabase(this.app);
  private storage = getStorage(this.app);

  // อัปโหลดรูปภาพไป Firebase Storage
  async uploadImage(file: File, chatId: string, userId: string): Promise<string> {
    const filePath = `chat_images/${chatId}/${userId}_${Date.now()}_${file.name}`;
    const imgRef = storageRef(this.storage, filePath);
    await uploadBytes(imgRef, file);
    return await getDownloadURL(imgRef);
  }

  // อัปโหลดวิดีโอไป Firebase Storage
  async uploadVideo(file: File, chatId: string, userId: string): Promise<string> {
    const filePath = `chat_videos/${chatId}/${userId}_${Date.now()}_${file.name}`;
    const videoRef = storageRef(this.storage, filePath);
    await uploadBytes(videoRef, file);
    return await getDownloadURL(videoRef);
  }

  // ส่งข้อความ (text, image, หรือ video)
  async sendMessage(chatId: string, userId: string, text: string = '', imageUrl: string = '', videoUrl: string = '', userName: string = ''): Promise<void> {
    const userIdStr = String(userId);
    const messageRef = push(ref(this.db, `chats/${chatId}/messages`));

    let type = 1; // default เป็น text
    if (videoUrl) {
      type = 3; // video
    } else if (imageUrl) {
      type = 2; // image
    }

    await set(messageRef, {
      uid: userIdStr,
      text: text || '',
      image_url: imageUrl || '',
      video_url: videoUrl || '',
      type: type, // 1=text, 2=image, 3=video
      create_at: new Date().toISOString()
    });

    // Update last message ใน user_chats index ของทั้งสอง user (ใช้ get แทน onValue)
    let lastMessage = text;
    if (videoUrl) {
      lastMessage = '[วิดีโอ]';
    } else if (imageUrl) {
      lastMessage = '[รูปภาพ]';
    }

    // ดึง users ในห้องแชทนี้ แบบ one-time
    const chatUsersRef = ref(this.db, `chats/${chatId}/users`);
    const snapshot = await get(chatUsersRef);
    const users = snapshot.val();
    // อัปเดต user_chats ของทั้งสอง user เสมอ
    const chatUserIds = chatId.split('_'); // ["29", "35"]
    for (const uid of chatUserIds) {
      const userChatRef = ref(this.db, `user_chats/${uid}/${chatId}`);
      await update(userChatRef, {
        last_message: lastMessage,
        last_message_time: new Date().toISOString(),
        last_message_sender_id: userIdStr,
        last_message_sender_name: userName || users?.[userIdStr]?.username || 'คุณ'
      });
    }

    // รอสักครู่เพื่อให้ Firebase อัปเดตข้อมูล
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // subscribe ดึงข้อความแชทแบบ real-time
  listenMessages(chatId: string, callback: (messages: any[]) => void): void {
    const messagesRef = ref(this.db, `chats/${chatId}/messages`);
    onValue(messagesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const messages = data
        ? Object.entries(data).map(([key, value]: [string, any]) => ({ id: key, ...value }))
        : [];
      callback(messages);
    });
  }

  // เพิ่ม user เข้า chat และ update user_chats index
  async addUserToChat(chatId: string, user: { user_id: string, username: string, image_url: string }, otherUser: { user_id: string, username: string, image_url: string }) {
    // เพิ่ม user ใน chat
    const userRef = ref(this.db, `chats/${chatId}/users/${user.user_id}`);
    await set(userRef, user);
    
    // เพิ่มใน user_chats index สำหรับ user นี้
    const userChatRef = ref(this.db, `user_chats/${user.user_id}/${chatId}`);
    await set(userChatRef, {
      last_message: '',
      last_message_time: new Date().toISOString(),
      other_user: otherUser.user_id,
      other_username: otherUser.username,
      other_image_url: otherUser.image_url
    });

    // เพิ่มใน user_chats index สำหรับ other user ด้วย
    const otherUserChatRef = ref(this.db, `user_chats/${otherUser.user_id}/${chatId}`);
    await set(otherUserChatRef, {
      last_message: '',
      last_message_time: new Date().toISOString(),
      other_user: user.user_id,
      other_username: user.username,
      other_image_url: user.image_url
    });

    // รอสักครู่เพื่อให้ Firebase อัปเดตข้อมูล
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // ดึงรายชื่อห้องแชทของ user (แบบ one-time)
  getUserChats(userId: string, callback: (chats: any[]) => void): void {
    const userChatsRef = ref(this.db, `user_chats/${userId}`);
    
    // ใช้ get() แทน onValue() เพื่อดึงข้อมูลครั้งเดียว
    get(userChatsRef).then((snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const chats = data 
        ? Object.entries(data).map(([chatId, chatData]: [string, any]) => ({
            chatId,
            ...chatData
          })).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())
        : [];
      callback(chats);
    }).catch(error => {
      console.error('Error fetching user chats:', error);
      callback([]);
    });
  }

  // เพิ่ม method ใหม่สำหรับดึงข้อมูลแบบ real-time (ถ้าต้องการ)
  listenUserChats(userId: string, callback: (chats: any[]) => void): void {
    const userChatsRef = ref(this.db, `user_chats/${userId}`);
    onValue(userChatsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const chats = data 
        ? Object.entries(data).map(([chatId, chatData]: [string, any]) => ({
            chatId,
            ...chatData
          })).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())
        : [];
      callback(chats);
    });
  }

  // สร้างห้องแชทใหม่
  async createChat(user1: { user_id: string, username: string, image_url: string }, user2: { user_id: string, username: string, image_url: string }): Promise<string> {
    const chatId = [user1.user_id, user2.user_id].sort().join('_');
    
    // สร้าง chat document
    const chatRef = ref(this.db, `chats/${chatId}`);
    await set(chatRef, {
      chat_id: chatId,
      create_at: new Date().toISOString(),
      update_at: new Date().toISOString()
    });

    // เพิ่ม users เข้า chat
    await this.addUserToChat(chatId, user1, user2);
    
    // รอสักครู่แล้วรีเฟรช user_chats เพื่อให้แน่ใจว่าข้อมูลถูกอัปเดต
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return chatId;
  }

  // ลบแชทออกจากรายการของผู้ใช้ (เมื่อผู้ใช้ถูกลบออกจากระบบ)
  async removeChatFromUser(userId: string, chatId: string): Promise<void> {
    const userChatRef = ref(this.db, `user_chats/${userId}/${chatId}`);
    await set(userChatRef, null); // ลบแชทออกจาก user_chats
    console.log(`Removed chat ${chatId} from user ${userId}`);
  }

  // ลบไฟล์ทั้งหมดในโฟลเดอร์แชท (ทั้งรูปและวิดีโอ)
  async deleteAllChatMedia(chatId: string): Promise<void> {
    // ลบรูปภาพ
    const imagesFolderRef = storageRef(this.storage, `chat_images/${chatId}`);
    const imagesList = await listAll(imagesFolderRef);
    for (const item of imagesList.items) {
      await deleteObject(item);
    }
    // ลบวิดีโอ
    const videosFolderRef = storageRef(this.storage, `chat_videos/${chatId}`);
    const videosList = await listAll(videosFolderRef);
    for (const item of videosList.items) {
      await deleteObject(item);
    }
  }

  // ลบข้อความทั้งหมดในแชท (Realtime DB)
  async deleteAllChatMessages(chatId: string): Promise<void> {
    const messagesRef = ref(this.db, `chats/${chatId}/messages`);
    await remove(messagesRef);
  }

  // ลบ users ในแชท (Realtime DB)
  async deleteAllChatUsers(chatId: string): Promise<void> {
    const usersRef = ref(this.db, `chats/${chatId}/users`);
    await remove(usersRef);
  }

  // ลบทั้งห้องแชท (ข้อความ, รูป, วิดีโอ, users)
  async deleteEntireChat(chatId: string): Promise<void> {
    await this.deleteAllChatMessages(chatId);
    await this.deleteAllChatUsers(chatId);
    await this.deleteAllChatMedia(chatId);
    // ลบข้อมูลห้องแชทหลัก (chats/{chatId})
    const chatRef = ref(this.db, `chats/${chatId}`);
    await remove(chatRef);
  }

  // อัปเดตข้อมูลแชทที่มีอยู่แล้วให้ครบถ้วน
  async updateChatUserInfo(chatId: string, userId: string, userData: { username: string, image_url: string }): Promise<void> {
    try {
      // อัปเดตข้อมูลใน user_chats
      const userChatRef = ref(this.db, `user_chats/${userId}/${chatId}`);
      await update(userChatRef, {
        other_username: userData.username,
        other_image_url: userData.image_url
      });
    } catch (error) {
      console.error('Error updating chat user info:', error);
    }
  }

  // ดึงข้อมูลแชทที่มีอยู่แล้วและอัปเดตข้อมูลผู้ใช้ที่ขาดหายไป
  async refreshChatUserData(userId: string): Promise<void> {
    try {
      const userChatsRef = ref(this.db, `user_chats/${userId}`);
      const snapshot = await get(userChatsRef);
      const chats = snapshot.val();
      
      if (chats) {
        for (const [chatId, chatData] of Object.entries(chats)) {
          const chat = chatData as any;
          
          // ตรวจสอบว่าแชทนี้มี other_user หรือไม่
          if (!chat.other_user && chatId.includes('_')) {
            // แยก chatId เพื่อหา otherUserId
            const chatUserIds = chatId.split('_');
            const otherUserId = chatUserIds.find(id => id !== userId);
            
            if (otherUserId) {
              // อัปเดต other_user ใน Firebase
              const userChatRef = ref(this.db, `user_chats/${userId}/${chatId}`);
              await update(userChatRef, {
                other_user: otherUserId
              });
            }
          }
          
          if (chat.other_user && (!chat.other_username || !chat.other_image_url)) {
            // ข้อมูลผู้ใช้จะถูกอัปเดตใน component เมื่อโหลดแชท
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing chat user data:', error);
    }
  }
}