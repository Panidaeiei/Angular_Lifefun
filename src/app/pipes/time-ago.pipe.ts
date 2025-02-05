import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const now = new Date();
    const commentDate = new Date(value);
    const seconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (seconds <= 0) {
      return ''; // ไม่แสดงอะไรเลยหากเป็น 0 วินาที
    } else if (seconds < 60) {
      return `${seconds} วินาที`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} นาที`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} ชั่วโมง`;
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
  }
}
