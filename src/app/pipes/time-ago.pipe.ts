import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';
    
    try {
    const now = new Date();
      let commentDate: Date;
      
      // แปลงเวลาจาก UTC กลับเป็นเวลาท้องถิ่น
      if (typeof value === 'string') {
        // ถ้าเป็น string ที่มี Z (UTC) ให้แปลงเป็นเวลาท้องถิ่น
        if (value.includes('Z')) {
          // สร้าง Date object จาก UTC string
          const utcDate = new Date(value);
          // แปลงเป็นเวลาท้องถิ่น
          commentDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
        } else {
          // ถ้าไม่มี Z ให้ใช้เป็นเวลาท้องถิ่นเลย
          commentDate = new Date(value);
        }
      } else {
        commentDate = value;
      }
      
      // ตรวจสอบว่าค่า valid หรือไม่
      if (isNaN(commentDate.getTime())) {
        console.warn('Invalid date value:', value);
        return '';
      }
      
    const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

      // ถ้าเวลาเป็นลบ (โพสต์ในอนาคต) ให้แสดง "ตอนนี้"
    if (seconds <= 0) {
        return 'ตอนนี้';
    } else if (seconds < 60) {
        return `${seconds} วินาทีที่แล้ว`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
        return `${minutes} นาทีที่แล้ว`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
        return `${hours} ชั่วโมงที่แล้ว`;
    } else if (seconds < 2592000) {
      const days = Math.floor(seconds / 86400);
      return `${days} วันที่แล้ว`;
    } else if (seconds < 31536000) {
      const months = Math.floor(seconds / 2592000);
      return `${months} เดือนที่แล้ว`;
    } else {
      const years = Math.floor(seconds / 31536000);
      return `${years} ปีที่แล้ว`;
      }
    } catch (error) {
      console.error('Error in timeAgo pipe:', error);
      return '';
    }
  }
}

@Pipe({
  name: 'formatLocalTime',
  standalone: true,
})
export class FormatLocalTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';
    
    try {
      let date: Date;
      
      // แปลงเวลาจาก UTC กลับเป็นเวลาท้องถิ่น
      if (typeof value === 'string') {
        if (value.includes('Z')) {
          // ถ้าเป็น UTC string ให้แปลงเป็นเวลาท้องถิ่น
          const utcDate = new Date(value);
          date = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000));
        } else {
          // ถ้าไม่มี Z ให้ใช้เป็นเวลาท้องถิ่นเลย
          date = new Date(value);
        }
      } else {
        date = value;
      }
      
      // ตรวจสอบว่าค่า valid หรือไม่
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // แสดงในรูปแบบ YYYY-MM-DD HH:MM:SS
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error in formatLocalTime pipe:', error);
      return '';
    }
  }
}
