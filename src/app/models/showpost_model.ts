export interface ShowPost {
  post_id: number;
  title: string;
  location: string;
  likes_count: number;
  post_time: string;
  category_name: string;
  user_name: string;
  user_profile_image: string | null;
  user_uid: number;
  media_url: string | null; // รูปแรกหรือวิดีโอแรก
  media_type: 'image' | 'video' | null; // ประเภทของ media_url
  isLiked?: boolean; // สถานะถูกใจ
  hasMultipleMedia?: boolean; // สถานะว่ามีหลายรูป
  currentImageIndex: number; // รูปภาพที่แสดงในปัจจุบัน
  
}

