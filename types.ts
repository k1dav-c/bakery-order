
export type OrderStatus = "待匯款" | "匯款完成" | "待製作" | "製作完成" | "待領取" | "領取完成" | "有問題";

export interface PriceConfig {
  itemName: string;
  price: number;
  displayName: string;
}

export interface GroupConfig {
  name: string;
  dates: string[];
}

export interface AppConfig {
  igColumn: string;
  dateColumn: string;
  shippingColumn: string;
}

export interface RawData {
  headers: string[];
  rows: any[][];
}

export interface ProcessedOrder {
  status: OrderStatus;
  totalAmount: number;
  igUrl: string;
  originalData: any[];
  shippingType: 'Pickup' | 'Shipping';
  groupKey?: string;
}

export interface ProcessedResults {
  all: ProcessedOrder[];
  shipping: ProcessedOrder[];
  pickup: ProcessedOrder[];
  groups: Record<string, ProcessedOrder[]>;
  headers: string[];
}
