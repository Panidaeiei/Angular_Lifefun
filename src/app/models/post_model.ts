export interface Post {
    title: string;
    location: string;
    cat_id: number;
    uid: number;
    imageUrls?: string[]; // URL ของรูปภาพ (อาจจะไม่ส่งมา)
    videoUrls?: string[]; // URL ของวิดีโอ (อาจจะไม่ส่งมา)
  }
  