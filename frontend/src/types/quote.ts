export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface ClientInfo {
  companyName: string;
  inn: string;
  contactPerson: string;
  phone: string;
  email: string;
}

export interface QuoteSettings {
  vatEnabled: boolean;
  vatRate: number;
  freeDeliveryEnabled: boolean;
  deliveryCost: number;
}

export interface QuoteState {
  client: ClientInfo;
  items: LineItem[];
  settings: QuoteSettings;
}

export interface LineItemCalculated extends LineItem {
  baseLineTotal: number;
  deliverySurcharge: number;
  finalLineTotal: number;
}

export interface QuoteCalculationResult {
  items: LineItemCalculated[];
  subtotalBeforeDelivery: number;
  deliveryCostTotal: number;
  deliveryDistributed: boolean;
  subtotalAfterDelivery: number;
  vatAmount: number;
  grandTotal: number;
}

export interface QuoteHistoryItem {
  id: number;
  companyName: string;
  contactPerson: string;
  totalAmount: number;
  createdAt: string;
}
