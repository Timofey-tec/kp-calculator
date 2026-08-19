import type { ClientInfo, LineItem, QuoteSettings, QuoteState } from "../types/quote";

function createEmptyItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
  };
}

export function createInitialQuoteState(): QuoteState {
  return {
    client: {
      companyName: "",
      inn: "",
      contactPerson: "",
      phone: "",
      email: "",
    },
    items: [createEmptyItem()],
    settings: {
      vatEnabled: true,
      vatRate: 20,
      freeDeliveryEnabled: false,
      deliveryCost: 0,
    },
  };
}

export type QuoteAction =
  | { type: "ADD_ITEM" }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_ITEM_FIELD"; id: string; field: keyof LineItem; value: string | number }
  | { type: "UPDATE_CLIENT_FIELD"; field: keyof ClientInfo; value: string }
  | { type: "UPDATE_SETTINGS_FIELD"; field: keyof QuoteSettings; value: boolean | number }
  | { type: "LOAD_STATE"; state: QuoteState }
  | { type: "RESET" };

export function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case "ADD_ITEM":
      return { ...state, items: [...state.items, createEmptyItem()] };

    case "REMOVE_ITEM": {
      const items = state.items.filter((item) => item.id !== action.id);
      // всегда должна оставаться хотя бы одна позиция для ввода
      return { ...state, items: items.length > 0 ? items : [createEmptyItem()] };
    }

    case "UPDATE_ITEM_FIELD":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, [action.field]: action.value } : item,
        ),
      };

    case "UPDATE_CLIENT_FIELD":
      return { ...state, client: { ...state.client, [action.field]: action.value } };

    case "UPDATE_SETTINGS_FIELD":
      return { ...state, settings: { ...state.settings, [action.field]: action.value } };

    case "LOAD_STATE":
      return action.state;

    case "RESET":
      return createInitialQuoteState();

    default:
      return state;
  }
}
