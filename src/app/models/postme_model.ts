export interface Postme {
    post_id: number;       // รหัสโพสต์ (Primary Key)
    title: string;         // ชื่อโพสต์
    location: string;      // ตำแหน่งที่ตั้ง
    cat_id: number;        // รหัสหมวดหมู่
    uid: number;           // รหัสผู้ใช้ที่สร้างโพสต์
    likes_count: number;   // จำนวนไลค์ในโพสต์
    post_time: string;     // เวลาที่โพสต์
    firstMediaUrl: string; // URL ของรูปหรือวิดีโอแรก
    media_type: 'image' | 'video'; // ประเภทของสื่อ (รูปภาพหรือวิดีโอ)
    hasMultipleMedia?: boolean; // บ่งบอกว่าโพสต์มีหลายรูป/วิดีโอหรือไม่
  }
  