import { describe, expect, it } from "vitest";

import type { LineItem, QuoteSettings } from "../types/quote";
import { calculateQuote, distributeDelivery, validateQuote } from "./quoteCalculations";

function makeItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: "1",
    name: "Товар",
    quantity: 1,
    unitPrice: 100,
    discountPercent: 0,
    ...overrides,
  };
}

function makeSettings(overrides: Partial<QuoteSettings> = {}): QuoteSettings {
  return {
    vatEnabled: false,
    vatRate: 20,
    freeDeliveryEnabled: false,
    deliveryCost: 0,
    ...overrides,
  };
}

describe("calculateQuote", () => {
  it("считает сумму без скидки, НДС и доставки", () => {
    const result = calculateQuote([makeItem({ quantity: 2, unitPrice: 100 })], makeSettings());
    expect(result.items[0].baseLineTotal).toBe(200);
    expect(result.subtotalAfterDelivery).toBe(200);
    expect(result.grandTotal).toBe(200);
  });

  it("применяет скидку к позиции", () => {
    const result = calculateQuote(
      [makeItem({ quantity: 10, unitPrice: 100, discountPercent: 10 })],
      makeSettings(),
    );
    expect(result.items[0].baseLineTotal).toBeCloseTo(900);
  });

  it("начисляет НДС на сумму после доставки", () => {
    const result = calculateQuote(
      [makeItem({ quantity: 1, unitPrice: 1000 })],
      makeSettings({ vatEnabled: true, vatRate: 20 }),
    );
    expect(result.vatAmount).toBeCloseTo(200);
    expect(result.grandTotal).toBeCloseTo(1200);
  });

  it("платная доставка показывается отдельной суммой, не трогая позиции", () => {
    const result = calculateQuote(
      [makeItem({ quantity: 1, unitPrice: 1000 })],
      makeSettings({ deliveryCost: 300, freeDeliveryEnabled: false }),
    );
    expect(result.deliveryDistributed).toBe(false);
    expect(result.deliveryCostTotal).toBe(300);
    expect(result.items[0].finalLineTotal).toBe(1000);
    expect(result.subtotalAfterDelivery).toBe(1300);
  });

  it("бесплатная доставка размазывается по позициям пропорционально их доле", () => {
    const items: LineItem[] = [
      makeItem({ id: "1", quantity: 1, unitPrice: 1000 }), // доля 25%
      makeItem({ id: "2", quantity: 1, unitPrice: 3000 }), // доля 75%
    ];
    const result = calculateQuote(items, makeSettings({ freeDeliveryEnabled: true, deliveryCost: 400 }));

    expect(result.deliveryDistributed).toBe(true);
    expect(result.deliveryCostTotal).toBe(0);
    expect(result.items[0].deliverySurcharge).toBeCloseTo(100);
    expect(result.items[1].deliverySurcharge).toBeCloseTo(300);
    expect(result.items[0].finalLineTotal).toBeCloseTo(1100);
    expect(result.items[1].finalLineTotal).toBeCloseTo(3300);
    // доставка не должна фигурировать отдельной строкой в сумме
    expect(result.subtotalAfterDelivery).toBeCloseTo(4400);
  });

  it("не распределяет доставку, если сумма позиций равна нулю", () => {
    const result = calculateQuote(
      [makeItem({ quantity: 0, unitPrice: 0 })],
      makeSettings({ freeDeliveryEnabled: true, deliveryCost: 500 }),
    );
    expect(result.deliveryDistributed).toBe(false);
    expect(result.deliveryCostTotal).toBe(500);
  });
});

describe("distributeDelivery", () => {
  it("не размазывает доставку, если опция выключена", () => {
    const { items, deliveryDistributed } = distributeDelivery(
      [makeItem({ quantity: 1, unitPrice: 100 })],
      500,
      false,
    );
    expect(deliveryDistributed).toBe(false);
    expect(items[0].deliverySurcharge).toBe(0);
  });
});

describe("validateQuote", () => {
  it("требует хотя бы одну позицию", () => {
    const errors = validateQuote([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("items");
  });

  it("не допускает отрицательное количество или цену", () => {
    const errors = validateQuote([makeItem({ quantity: -1, unitPrice: -5 })]);
    expect(errors.some((e) => e.field === "items.0.quantity")).toBe(true);
    expect(errors.some((e) => e.field === "items.0.unitPrice")).toBe(true);
  });

  it("не допускает пустое наименование", () => {
    const errors = validateQuote([makeItem({ name: "  " })]);
    expect(errors.some((e) => e.field === "items.0.name")).toBe(true);
  });

  it("валидная позиция не даёт ошибок", () => {
    const errors = validateQuote([makeItem()]);
    expect(errors).toHaveLength(0);
  });
});
