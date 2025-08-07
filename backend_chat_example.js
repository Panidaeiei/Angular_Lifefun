// ตัวอย่าง Backend API สำหรับแชท (Node.js + Express + MySQL + Firebase)

const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Firebase Admin SDK setup
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project.firebaseio.com"
});

const db = admin.database();

// MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
});

// Middleware สำหรับตรวจสอบ token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// 1. ดึงรายการแชทของผู้ใช้
app.get('/chat_list/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // ดึงรายการแชทจาก Firebase
    const chatRef = db.ref('chats');
    const snapshot = await chatRef.orderByChild('participants').equalTo(userId).once('value');
    
    const chats = [];
    snapshot.forEach((childSnapshot) => {
      const chat = childSnapshot.val();
      const chatId = childSnapshot.key;
      
      // หาคู่สนทนาที่ไม่ใช่ตัวเอง
      const otherUserId = chat.participants.find(id => id !== userId);
      
      // ดึงข้อมูลผู้ใช้อีกฝั่งจาก MySQL
      const [users] = await pool.execute(
        'SELECT id, username, profile_image FROM users WHERE id = ?',
        [otherUserId]
      );
      
      if (users.length > 0) {
        const otherUser = users[0];
        chats.push({
          chatId: chatId,
          name: otherUser.username,
          avatar: otherUser.profile_image || 'https://randomuser.me/api/portraits/lego/1.jpg',
          lastMessage: chat.lastMessage || '',
          participants: chat.participants
        });
      }
    });
    
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chat list:', error);
    res.status(500).json({ error: 'Failed to fetch chat list' });
  }
});

// 2. ดึงข้อความของแชท
app.get('/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // ดึงข้อความจาก Firebase
    const messagesRef = db.ref(`messages/${chatId}`);
    const snapshot = await messagesRef.orderByChild('timestamp').once('value');
    
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      messages.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 3. ส่งข้อความ (อัปเดตจากที่มีอยู่)
app.post('/send', authenticateToken, multer().single('image'), async (req, res) => {
  try {
    const { chatId, uid, text, type } = req.body;
    const image = req.file;
    
    let messageData = {
      senderId: uid,
      timestamp: Date.now(),
      type: parseInt(type) // 1 = ข้อความ, 2 = รูป
    };
    
    if (type === '1' && text) {
      messageData.text = text;
    } else if (type === '2' && image) {
      // อัปโหลดรูปไป Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `chat_images/${chatId}/${Date.now()}_${image.originalname}`;
      const file = bucket.file(fileName);
      
      await file.save(image.buffer, {
        metadata: {
          contentType: image.mimetype
        }
      });
      
      // สร้าง URL สำหรับรูป
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
      });
      
      messageData.image = url;
    }
    
    // บันทึกข้อความลง Firebase
    const messageRef = db.ref(`messages/${chatId}`);
    const newMessageRef = await messageRef.push(messageData);
    
    // อัปเดต lastMessage ในแชท
    const chatRef = db.ref(`chats/${chatId}`);
    await chatRef.update({
      lastMessage: type === '1' ? text : 'ส่งรูปภาพ',
      lastMessageTime: Date.now()
    });
    
    res.json({
      success: true,
      messageId: newMessageRef.key,
      message: messageData
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 4. สร้างแชทใหม่ (เมื่อเริ่มแชทกับผู้ใช้ใหม่)
app.post('/create_chat', authenticateToken, async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;
    
    // สร้าง chatId
    const sortedIds = [userId1, userId2].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
    
    // ตรวจสอบว่าแชทมีอยู่แล้วหรือไม่
    const chatRef = db.ref(`chats/${chatId}`);
    const snapshot = await chatRef.once('value');
    
    if (snapshot.exists()) {
      return res.json({ chatId: chatId, exists: true });
    }
    
    // สร้างแชทใหม่
    await chatRef.set({
      participants: [userId1, userId2],
      createdAt: Date.now(),
      lastMessage: '',
      lastMessageTime: null
    });
    
    res.json({ chatId: chatId, exists: false });
    
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// 5. Real-time updates (WebSocket หรือ Server-Sent Events)
// สำหรับ real-time ควรใช้ Socket.io หรือ Firebase Realtime Database listeners

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 