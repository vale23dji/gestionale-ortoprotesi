import { LavorazioneDTO } from './LavorazioneDTO';

export interface ClienteRaggruppatoDTO {
  clienteId?: number;
  nomeCompletoCliente: string;
  numeroLavorazioni: number;
  ultimaLavorazione?: LavorazioneDTO;
}
