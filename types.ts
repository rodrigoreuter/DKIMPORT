export interface StockItem {
  id: string; // Composite key: marca-modelo-tamanho-cor
  marca: string;
  modelo: string;
  tamanho: string;
  cor: string;
  quantidade: number;
}

export type FormState = {
  marca: string;
  modelo: string;
  tamanho: string;
  cor: string;
  quantidade: string;
};

// Tipos para a comunicação com a API do Google Apps Script
export type ApiAction = 'getItems' | 'addItem' | 'updateItem' | 'deleteItem';

export interface ApiPayload {
  action: ApiAction;
  data?: any;
}
