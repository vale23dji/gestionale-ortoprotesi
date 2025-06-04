import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDatetime',
  standalone: true
})
export class FormatDatetimePipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    if (!value) return '-';

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) return '-';

    // Formato: DD/MM/YYYY HH:MM
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}
