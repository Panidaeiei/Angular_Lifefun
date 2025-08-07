import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'newlineToBr',
  standalone: true,
})
export class NewlineToBrPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;
    return value.replace(/\n/g, '<br>');
  }
}
