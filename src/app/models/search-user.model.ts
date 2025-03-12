export interface SearchUser {
    uid: string;
    email: string;
    password: string;
    username: string;
    phone: string;
    image_url: string;
    description: string;
    followersCount: number; // จำนวนผู้ติดตาม
    followingCount: number; // จำนวนที่กำลังติดตาม
}
