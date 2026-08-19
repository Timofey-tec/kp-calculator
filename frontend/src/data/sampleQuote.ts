import type { QuoteState } from "../types/quote";

export function createSampleQuoteState(): QuoteState {
  return {
    client: {
      companyName: "ООО «Завод Металлоконструкций»",
      inn: "7701234567",
      contactPerson: "Сидоров Сидор Сидорович",
      phone: "+7 900 123-45-67",
      email: "zakupki@zavodmk.example",
    },
    items: [
      {
        id: crypto.randomUUID(),
        name: "Металлопрокат листовой, 4 мм",
        quantity: 12,
        unitPrice: 4500,
        discountPercent: 5,
      },
      {
        id: crypto.randomUUID(),
        name: "Профильная труба 40х40",
        quantity: 80,
        unitPrice: 320,
        discountPercent: 0,
      },
      {
        id: crypto.randomUUID(),
        name: "Монтажные работы",
        quantity: 1,
        unitPrice: 65000,
        discountPercent: 10,
      },
    ],
    settings: {
      vatEnabled: true,
      vatRate: 20,
      freeDeliveryEnabled: true,
      deliveryCost: 8000,
    },
  };
}
