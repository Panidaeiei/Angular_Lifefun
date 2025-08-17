
// import { Injectable, inject, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
// import { environment } from '../environments/environment';

// @Injectable({ providedIn: 'root' })
// export class NotificationService implements OnInit {
//   private messaging = inject(Messaging);
//   private http = inject(HttpClient);

//   ngOnInit() {
//     // Initialize messaging service
//     console.log('✅ NotificationService initialized');
//   }

//   async init(userId: number) {
//     try {
//       // 0) ตรวจสอบและขอ Notification Permission ก่อน
//       const permission = await this.requestNotificationPermission();
//       if (permission !== 'granted') {
//         console.log('❌ Notification permission ไม่ได้รับอนุญาต:', permission);
//         return;
//       }

//       // 1) ตรวจสอบ Firebase config ก่อน
//       if (!this.validateFirebaseConfig()) {
//         console.error('❌ Firebase config ไม่ถูกต้อง');
//         return;
//       }

//       // 2) ขอ token ด้วย VAPID key (เอามาใส่ใน environment.vapidKey)
//       const token = await getToken(this.messaging, { vapidKey: environment.vapidKey });
//       if (!token) {
//         console.log('❌ ไม่สามารถขอ FCM token ได้');
//         return;
//       }

//       console.log('✅ ได้ FCM token:', token);

//       // 3) ส่ง token ไปเก็บที่ backend (เพื่อลด DB ให้เก็บเฉพาะตอน token เปลี่ยน)
//       try {
//         await this.http.post(`${environment.apiBaseUrl}/register-fcm-token`, {
//           userId,
//           fcmToken: token,
//         }).toPromise();
//         console.log('✅ ส่ง FCM token ไป backend แล้ว');
//       } catch (backendError: any) {
//         if (backendError.status === 404) {
//           console.warn('⚠️ Backend endpoint ไม่มีอยู่ - เก็บ token ใน localStorage แทน');
//           this.saveTokenLocally(userId, token);
//         } else {
//           throw backendError;
//         }
//       }

//       // 4) ฟังข้อความตอนหน้าเว็บโฟกัส (foreground)
//       onMessage(this.messaging, (payload) => {
//         console.log('📩 FCM foreground:', payload);
//         this.showNotification(payload);
//       });

//     } catch (error) {
//       console.error('❌ Error ใน NotificationService.init:', error);
//       this.handleFirebaseError(error);
//     }
//   }

//   // ตรวจสอบ Firebase config
//   private validateFirebaseConfig(): boolean {
//     try {
//       const config = environment.firebase;
//       if (!config.apiKey || !config.authDomain || !config.projectId) {
//         console.error('❌ Firebase config ไม่ครบถ้วน');
//         return false;
//       }
      
//       // ตรวจสอบ VAPID key
//       if (!environment.vapidKey) {
//         console.error('❌ VAPID key ไม่พบ');
//         return false;
//       }

//       console.log('✅ Firebase config ถูกต้อง');
//       return true;
//     } catch (error) {
//       console.error('❌ Error ตรวจสอบ Firebase config:', error);
//       return false;
//     }
//   }

//   // จัดการ Firebase error
//   private handleFirebaseError(error: any): void {
//     if (error.code === 'installations/request-failed') {
//       console.error('❌ Firebase Installation failed - ตรวจสอบ API Key และ Project ID');
//       console.error('💡 วิธีแก้ไข:');
//       console.error('1. ไปที่ Firebase Console → Project Settings');
//       console.error('2. ตรวจสอบ Web API Key ว่าตรงกับ environment.ts');
//       console.error('3. ตรวจสอบ Project ID ว่าตรงกัน');
//       console.error('4. ตรวจสอบว่า Cloud Messaging เปิดใช้งานแล้ว');
//     } else if (error.code === 'messaging/permission-blocked') {
//       console.error('❌ Notification permission ถูกบล็อก');
//     } else {
//       console.error('❌ Firebase error อื่นๆ:', error);
//     }
//   }

//   // ขอ Notification Permission
//   private async requestNotificationPermission(): Promise<NotificationPermission> {
//     // ตรวจสอบว่า browser รองรับ notifications หรือไม่
//     if (!('Notification' in window)) {
//       console.log('❌ Browser ไม่รองรับ notifications');
//       this.showPermissionError('Browser ไม่รองรับ notifications');
//       return 'denied';
//     }

//     // ตรวจสอบ permission ปัจจุบัน
//     if (Notification.permission === 'granted') {
//       console.log('✅ Notification permission ได้รับแล้ว');
//       return 'granted';
//     }

//     if (Notification.permission === 'denied') {
//       console.log('❌ Notification permission ถูกปฏิเสธ');
//       this.showPermissionError('Notification permission ถูกปฏิเสธ กรุณาอนุญาตใน browser settings');
//       return 'denied';
//     }

//     // ขอ permission ถ้ายังไม่เคยขอ
//     try {
//       console.log('📱 ขอ notification permission...');
//       const permission = await Notification.requestPermission();
//       console.log('📱 Notification permission result:', permission);
      
//       if (permission === 'denied') {
//         this.showPermissionError('Notification permission ถูกปฏิเสธ กรุณาอนุญาตเพื่อรับการแจ้งเตือน');
//       }
      
//       return permission;
//     } catch (error) {
//       console.error('❌ Error ขอ notification permission:', error);
//       this.showPermissionError('เกิดข้อผิดพลาดในการขอ notification permission');
//       return 'denied';
//     }
//   }

//   // แสดงข้อความแนะนำผู้ใช้
//   private showPermissionError(message: string): void {
//     // ตรวจสอบว่าเป็น Edge browser หรือไม่
//     const isEdge = navigator.userAgent.includes('Edg');
    
//     let instructions = '';
//     if (isEdge) {
//       instructions = `วิธีแก้ไขใน Edge Browser:\n1. คลิกที่ไอคอน "..." (เมนู) มุมขวาบน\n2. เลือก "Settings"\n3. คลิก "Cookies and site permissions"\n4. ค้นหา "Notifications"\n5. คลิก "Notifications"\n6. เปลี่ยนจาก "Block" เป็น "Allow" สำหรับเว็บไซต์นี้`;
//     } else {
//       instructions = `วิธีแก้ไข:\n1. ไปที่ browser settings\n2. ค้นหา "Notifications"\n3. อนุญาตสำหรับเว็บไซต์นี้`;
//     }
    
//     // แสดง alert หรือ toast ให้ผู้ใช้ทราบ
//     alert(`🔔 ${message}\n\n${instructions}`);
    
//     // หรือใช้ console.log สำหรับ developer
//     console.log('💡 แนะนำผู้ใช้:', message);
//     console.log('📋 Instructions:', instructions);
//   }

//   // เก็บ token ใน localStorage (fallback)
//   private saveTokenLocally(userId: number, token: string): void {
//     try {
//       const tokenData = {
//         userId,
//         fcmToken: token,
//         timestamp: new Date().toISOString()
//       };
//       localStorage.setItem('fcmToken', JSON.stringify(tokenData));
//       console.log('✅ เก็บ FCM token ใน localStorage แล้ว');
//     } catch (error) {
//       console.error('❌ Error เก็บ token ใน localStorage:', error);
//     }
//   }

//   // แสดง notification (foreground)
//   private showNotification(payload: any): void {
//     if ('serviceWorker' in navigator && 'Notification' in window) {
//       const title = payload.notification?.title || 'การแจ้งเตือนใหม่';
//       const options = {
//         body: payload.notification?.body || 'คุณมีข้อความใหม่',
//         tag: 'notification'
//       };

//       // แสดง notification แม้จะอยู่ใน foreground
//       new Notification(title, options);
//     }
//   }
// }