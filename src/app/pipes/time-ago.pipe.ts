import { Pipe, PipeTransform } from '@angular/core';

/** helper: แปลงค่าเป็น Date แบบไม่เพี้ยนโซนเวลา */
function parseToDate(value: string | Date): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // ถ้ามาเป็น ISO (มี T หรือ Z) ให้ปล่อยให้ JS จัดการเอง
  if (value.includes('T') || value.includes('Z')) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // เคส 'YYYY-MM-DD HH:mm:ss' (ไม่มีโซน) → สร้าง Date แบบ local เพื่อเลี่ยงปัญหา browser
  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (m) {
    const [_, y, mo, d, h, mi, s] = m;
    const dd = new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(s || '0')
    );
    return isNaN(dd.getTime()) ? null : dd;
  }

  // เผื่อกรณีอื่น ๆ
  const d2 = new Date(value);
  return isNaN(d2.getTime()) ? null : d2;
}

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const commentDate = parseToDate(value);
    if (!commentDate) return '';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (seconds <= 0) return 'ตอนนี้';
    if (seconds < 60) return `${seconds} วินาทีที่แล้ว`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} วันที่แล้ว`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} เดือนที่แล้ว`;
    return `${Math.floor(seconds / 31536000)} ปีที่แล้ว`;
  }
}

@Pipe({ name: 'formatLocalTime', standalone: true })
export class FormatLocalTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = parseToDate(value);
    if (!date) return '';

    // ฟอร์แมตไทย: 20 สิงหาคม เวลา 01:20 น.
    const parts = new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok', // บังคับเป็นเวลาไทย
    }).formatToParts(date);

    const get = (t: string) => parts.find(p => p.type === t)?.value || '';
    const day = get('day');
    const month = get('month');
    const hour = get('hour').padStart(2, '0');
    const minute = get('minute').padStart(2, '0');

    return `${day} ${month} เวลา ${hour}:${minute} น.`;
  }
}
