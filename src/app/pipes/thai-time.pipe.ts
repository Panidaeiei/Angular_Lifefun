import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'thaiTime',
  standalone: true
})
export class ThaiTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';
    
    try {
      let date: Date;
      
      // แปลงเวลาจาก UTC กลับเป็นเวลาท้องถิ่น
      if (typeof value === 'string') {
        if (value.includes('Z')) {
          // ถ้าเป็น UTC string ให้แปลงเป็นเวลาท้องถิ่น (UTC+7 สำหรับประเทศไทย)
          const utcDate = new Date(value);
          date = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
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
      
      // แสดงในรูปแบบไทย
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      // แปลงเป็นปี พ.ศ.
      const thaiYear = year + 543;
      
      // แปลงเดือนเป็นภาษาไทย
      const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const thaiMonth = thaiMonths[month - 1];
      
      // แสดงในรูปแบบ "วันที่ เดือน ปี พ.ศ. เวลา"
      return `${day} ${thaiMonth} ${thaiYear} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error in thaiTime pipe:', error);
      return '';
    }
  }
}

@Pipe({
  name: 'thaiDateTime',
  standalone: true
})
export class ThaiDateTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';
    
    try {
      let date: Date;
      
      // แปลงเวลาจาก UTC กลับเป็นเวลาท้องถิ่น
      if (typeof value === 'string') {
        if (value.includes('Z')) {
          // ถ้าเป็น UTC string ให้แปลงเป็นเวลาท้องถิ่น (UTC+7 สำหรับประเทศไทย)
          const utcDate = new Date(value);
          date = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
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
      
      // แสดงในรูปแบบ YYYY-MM-DD HH:MM:SS (เวลาท้องถิ่น)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Error in thaiDateTime pipe:', error);
      return '';
    }
  }
} 