import { describe, expect, it } from "vitest";

import { createInitialQuoteState, quoteReducer } from "./quoteReducer";

describe("quoteReducer", () => {
  it("добавляет новую позицию", () => {
    const state = createInitialQuoteState();
    const next = quoteReducer(state, { type: "ADD_ITEM" });
    expect(next.items).toHaveLength(state.items.length + 1);
  });

  it("удаляет позицию по id", () => {
    let state = createInitialQuoteState();
    state = quoteReducer(state, { type: "ADD_ITEM" });
    const idToRemove = state.items[0].id;

    const next = quoteReducer(state, { type: "REMOVE_ITEM", id: idToRemove });
    expect(next.items.find((item) => item.id === idToRemove)).toBeUndefined();
    expect(next.items).toHaveLength(1);
  });

  it("не позволяет удалить последнюю оставшуюся позицию", () => {
    const state = createInitialQuoteState();
    const onlyId = state.items[0].id;

    const next = quoteReducer(state, { type: "REMOVE_ITEM", id: onlyId });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).not.toBe(onlyId);
  });

  it("обновляет поле позиции", () => {
    const state = createInitialQuoteState();
    const id = state.items[0].id;

    const next = quoteReducer(state, {
      type: "UPDATE_ITEM_FIELD",
      id,
      field: "unitPrice",
      value: 500,
    });
    expect(next.items[0].unitPrice).toBe(500);
  });

  it("обновляет данные клиента", () => {
    const state = createInitialQuoteState();
    const next = quoteReducer(state, {
      type: "UPDATE_CLIENT_FIELD",
      field: "companyName",
      value: "ООО Ромашка",
    });
    expect(next.client.companyName).toBe("ООО Ромашка");
  });

  it("обновляет настройки (например включает бесплатную доставку)", () => {
    const state = createInitialQuoteState();
    const next = quoteReducer(state, {
      type: "UPDATE_SETTINGS_FIELD",
      field: "freeDeliveryEnabled",
      value: true,
    });
    expect(next.settings.freeDeliveryEnabled).toBe(true);
  });

  it("сбрасывает состояние к начальному", () => {
    let state = createInitialQuoteState();
    state = quoteReducer(state, {
      type: "UPDATE_CLIENT_FIELD",
      field: "companyName",
      value: "Что-то",
    });
    const next = quoteReducer(state, { type: "RESET" });
    expect(next.client.companyName).toBe("");
  });
});
