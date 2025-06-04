import { Cliente } from "./cliente.model";

export interface Lavorazione {
  id?: number;
  clienteId: number;
  nomePaziente: string;
  cognomePaziente: string;
  etaPaziente: number | null;
  nomeCompletoCliente?: string;
  //cliente?: Cliente;
  tipiLavorazione: string[];
  stato: string;
  specificheTecniche: string;
  tipiLavorazioneStringEdit?: string;
  dataCreazione?: Date;
  numeroTelefonoPaziente: string;
  codiceFiscalePaziente: string;

  percorsiFileImmagini?: string[];
  percorsiFileStl?: string[];
}
