export interface DetailPost {
  post_id: number;
  title: string;
  location: string;
  likes_count: number;
  post_time: string;
  category_name: string;
  user_name: string;
  user_profile_image: string | null;
  user_uid: number;
  images: string[];  // เน้นที่แสดงภาพและวิดีโอ
  videos: string[];
  currentImageIndex: number;
  isLiked?: boolean; // สถานะถูกใจ
  media_url: string | null;
  media_type: 'image' | 'video' | null;
}
