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
  media_url: string | null; // รูปภาพหรือวิดีโอ URL
  media_type: 'image' | 'video' | null; // ประเภทของ media
  isLiked?: boolean; // สถานะถูกใจ
  hasMultipleMedia?: boolean; // สถานะว่ามีหลายรูปภาพหรือไม่
}
