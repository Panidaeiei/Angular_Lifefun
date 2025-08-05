import { Injectable } from '@angular/core';

export interface CacheData {
  data: any;
  timestamp: number;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor() { }

  // เก็บข้อมูลใน cache
  setCache(key: string, data: any, expiresIn: number = 24 * 60 * 60 * 1000): void {
    const cacheData: CacheData = {
      data: data,
      timestamp: Date.now(),
      expiresIn: expiresIn
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  }

  // ดึงข้อมูลจาก cache
  getCache<T>(key: string): T | null {
    const cached = localStorage.getItem(key);
    
    if (cached) {
      try {
        const cacheData: CacheData = JSON.parse(cached);
        const now = Date.now();
        
        // ตรวจสอบว่า cache หมดอายุหรือยัง
        if (now - cacheData.timestamp < cacheData.expiresIn) {
          return cacheData.data as T;
        } else {
          // ลบ cache ที่หมดอายุ
          this.removeCache(key);
        }
      } catch (error) {
        console.error('Error parsing cached data:', error);
        this.removeCache(key);
      }
    }
    
    return null;
  }

  // ลบ cache
  removeCache(key: string): void {
    localStorage.removeItem(key);
  }

  // ลบ cache ทั้งหมด
  clearAllCache(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('user_profile_') || key.startsWith('user_posts_') || 
                  key.startsWith('search_results_') || key.startsWith('follow_count_'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // ดูข้อมูล cache ทั้งหมด
  getAllCacheInfo(): Array<{key: string, size: number, age: number, expiresIn: number}> {
    const cacheInfo: Array<{key: string, size: number, age: number, expiresIn: number}> = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('user_profile_') || key.startsWith('user_posts_') || 
                  key.startsWith('search_results_') || key.startsWith('follow_count_'))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed: CacheData = JSON.parse(value);
            const size = new Blob([value]).size;
            const age = Math.floor((now - parsed.timestamp) / (1000 * 60)); // นาที
            
            cacheInfo.push({
              key: key,
              size: size,
              age: age,
              expiresIn: Math.floor(parsed.expiresIn / (1000 * 60)) // นาที
            });
          }
        } catch (error) {
          console.error('Error parsing cache:', key, error);
        }
      }
    }

    // เรียงตามอายุ (ใหม่สุดก่อน)
    return cacheInfo.sort((a, b) => a.age - b.age);
  }

  // ตรวจสอบว่า cache หมดอายุหรือยัง
  isCacheExpired(key: string): boolean {
    const cached = localStorage.getItem(key);
    
    if (cached) {
      try {
        const cacheData: CacheData = JSON.parse(cached);
        const now = Date.now();
        return now - cacheData.timestamp >= cacheData.expiresIn;
      } catch (error) {
        return true;
      }
    }
    
    return true;
  }

  // ดูขนาด cache ทั้งหมด
  getTotalCacheSize(): number {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('user_profile_') || key.startsWith('user_posts_') || 
                  key.startsWith('search_results_') || key.startsWith('follow_count_'))) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }
    
    return totalSize;
  }
} 