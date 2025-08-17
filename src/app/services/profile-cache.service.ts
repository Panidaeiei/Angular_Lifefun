import { Injectable } from '@angular/core';
import { User } from '../models/register_model';

export interface CachedProfile {
  data: User;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileCacheService {
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 นาที
  private profileCache = new Map<string, CachedProfile>();

  constructor() { }

  // เก็บข้อมูลโปรไฟล์ลง memory cache
  setProfileCache(userId: string, profileData: User): void {
    const cacheData: CachedProfile = {
      data: profileData,
      timestamp: Date.now()
    };

    this.profileCache.set(userId, cacheData);
    console.log(`Profile cached in memory for user: ${userId}`);
  }

  // ดึงข้อมูลโปรไฟล์จาก memory cache
  getProfileCache(userId: string): User | null {
    const cached = this.profileCache.get(userId);

    if (cached) {
      const now = Date.now();

      // ตรวจสอบว่า cache หมดอายุหรือไม่
      if (now - cached.timestamp < this.CACHE_EXPIRY) {
        console.log(`Profile loaded from memory cache for user: ${userId}`);
        return cached.data;
      } else {
        // ลบ cache ที่หมดอายุ
        this.profileCache.delete(userId);
        console.log(`Profile cache expired for user: ${userId}`);
      }
    }

    return null;
  }

  // ลบ cache ของ user เฉพาะ
  removeProfileCache(userId: string): void {
    this.profileCache.delete(userId);
    console.log(`Profile cache removed from memory for user: ${userId}`);
  }

  // ลบ cache ที่หมดอายุทั้งหมด
  cleanupExpiredCache(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    // หา cache ที่หมดอายุ
    this.profileCache.forEach((cached, userId) => {
      if (now - cached.timestamp >= this.CACHE_EXPIRY) {
        keysToRemove.push(userId);
      }
    });

    // ลบ cache ที่หมดอายุ
    keysToRemove.forEach(userId => {
      this.profileCache.delete(userId);
      console.log('Removed expired cache for user:', userId);
    });
  }

  // ตรวจสอบว่า cache มีข้อมูลหรือไม่
  hasProfileCache(userId: string): boolean {
    return this.getProfileCache(userId) !== null;
  }

  // ดึงข้อมูล cache ทั้งหมด (สำหรับ debug)
  getAllCachedProfiles(): { [userId: string]: CachedProfile } {
    const profiles: { [userId: string]: CachedProfile } = {};
    
    this.profileCache.forEach((cached, userId) => {
      profiles[userId] = cached;
    });
    
    return profiles;
  }

  // ลบ cache ทั้งหมด
  clearAllProfileCache(): void {
    this.profileCache.clear();
    console.log('All profile cache cleared from memory');
  }

  // ฟังก์ชันสำหรับจัดการ localStorage เฉพาะข้อมูลที่จำเป็น
  setLocalStorageData(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  getLocalStorageData(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeLocalStorageData(key: string): void {
    localStorage.removeItem(key);
  }

  // ฟังก์ชันสำหรับจัดการข้อมูลการเข้าสู่ระบบ
  setAuthData(token: string, userId: string, userRole?: string): void {
    this.setLocalStorageData('token', token);
    this.setLocalStorageData('userId', userId);
    if (userRole) {
      this.setLocalStorageData('userRole', userRole);
    }
    this.setLocalStorageData('lastLogin', Date.now().toString());
  }

  getAuthData(): { token: string | null; userId: string | null; userRole: string | null } {
    return {
      token: this.getLocalStorageData('token'),
      userId: this.getLocalStorageData('userId'),
      userRole: this.getLocalStorageData('userRole')
    };
  }

  clearAuthData(): void {
    this.removeLocalStorageData('token');
    this.removeLocalStorageData('userId');
    this.removeLocalStorageData('userRole');
    this.removeLocalStorageData('lastLogin');
    // ล้าง memory cache ด้วย
    this.clearAllProfileCache();
  }

  // ตรวจสอบว่ามีการเข้าสู่ระบบหรือไม่
  isAuthenticated(): boolean {
    const authData = this.getAuthData();
    return !!(authData.token && authData.userId);
  }
}
