export interface Ban {
    bid: number;         // ID ของการระงับ (ban ID)
    reason: string;      // เหตุผลในการระงับ
    status: number;      // สถานะของการระงับ (0 = ระงับ, 1 = ไม่ระงับ)
    status_date: string; // วันที่ระงับบัญชี
    end_date: string;    // วันที่สิ้นสุดการระงับ
    aid: number;         // ID ของผู้ดูแลที่ทำการระงับ
    uid: number;         // ID ของผู้ใช้ที่ถูกระงับ
  }
  
  export interface UserBan {
    uid?: number;
    email: string;
    password: string;
    phone: string;
    username: string;
    description?: string; 
    image_url?: string; 
    status?: number;
  }