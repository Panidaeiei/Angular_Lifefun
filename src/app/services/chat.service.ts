import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, onValue, DataSnapshot, update, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      // DEBUG LOG
      console.log('[DEBUG update user_chats]', {
        chatId,
        uid,
        userChatRefPath: `user_chats/${uid}/${chatId}`,
        last_message: lastMessage,
        last_message_sender_id: userIdStr,
        last_message_sender_name: userName || users?.[userIdStr]?.username || 'คุณ',
        usersObj: users
      });
    }
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
  }

  // ดึงรายชื่อห้องแชทของ user
  getUserChats(userId: string, callback: (chats: any[]) => void): void {
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
    
    return chatId;
  }
}