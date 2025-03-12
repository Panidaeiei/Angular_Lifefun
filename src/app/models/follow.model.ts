export interface Follow {
  following_id: string;  // คนที่ติดตาม
  followed_id: string;   // คนที่ถูกติดตาม
}

export interface FollowStatus {
  isFollowing: boolean; // สถานะติดตาม
}

export interface FollowCount {
  followers: number; // จำนวนผู้ติดตาม
  following: number; // จำนวนที่ติดตาม
}
