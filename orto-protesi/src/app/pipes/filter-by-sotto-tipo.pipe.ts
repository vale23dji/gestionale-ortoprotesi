import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBySottoTipo',
  standalone: true
})
export class FilterBySottoTipoPipe implements PipeTransform {
  transform(value: string[], tipo: 'Fissa' | 'Mobile'): string[] {
    return value.filter(v => {
      const opzioniFissa = [
        'Espansore', 'Arco saldato', 'Mantenitore di spazion',
        'Barra traspalatale', 'Fervula di delaire', 'Struttura su miniviti palatali', 'Griglia linguale'
      ];
      const opzioniMobile = [
        'E.L.N di Bonnet', 'Twin block', 'Placca di Hawley',
        'Placca di Schwartz', 'Placca di Bionator', 'Mascherina di contenzione',
        'Mascherina di sbiancamento', 'Placca Gianelly', 'Byte Dentale'
      ];

      return tipo === 'Fissa' ? opzioniFissa.includes(v) : opzioniMobile.includes(v);
    });
  }
}
