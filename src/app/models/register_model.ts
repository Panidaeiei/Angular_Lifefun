export interface User {
    id?: number;
    email: string;
    password: string;
    phone: string;
    username: string;
    description?: string; 
    image_url?: string; 
    status?: number;
    followers?: number; // เพิ่มฟิลด์ followers
    following?: number; // เพิ่มฟิลด์ following
  }
  

  