export interface LavorazioneDTO {
  id: number;
  clienteId?: number;
  creatoDaUtenteId?: number;
  nomePaziente: string;
  cognomePaziente: string;
  etaPaziente?: number | null;
  numeroTelefonoPaziente?: string;
  codiceFiscalePaziente?: string;
  nomeCompletoCliente?: string;
  tipiLavorazione: string[];
  stato: string;
  specificheTecniche?: string;
  dataCreazione?: Date | string;
  percorsiFileImmagini?: string[];
  percorsiFileStl?: string[];
}
