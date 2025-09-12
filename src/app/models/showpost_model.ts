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
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  isLiked?: boolean;
  hasMultipleMedia?: boolean;
  currentImageIndex?: number;
  allMedia?: { type: string; url: string }[];
  media_count?: number;
  total_views?: number; // เพิ่มฟิลด์ total_views
}

