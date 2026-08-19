/**
 * Чистая бизнес-логика расчёта КП. Полностью отделена от UI — не знает
 * ничего про React и может быть протестирована независимо. Портирована
 * 1:1 в backend/app/services/calculations.py для серверной валидации.
 */
import type { LineItem, LineItemCalculated, QuoteCalculationResult, QuoteSettings } from "../types/quote";

export function calculateBaseLineTotal(item: LineItem): number {
  return item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
}

export interface DeliveryDistributionResult {
  items: LineItemCalculated[];
  deliveryDistributed: boolean;
}

/**
 * Ключевая фича: если доставка "бесплатная", её стоимость не показывается
 * отдельной строкой, а размазывается по остальным позициям сметы
 * пропорционально доле каждой позиции в общей сумме.
 */
export function distributeDelivery(
  items: LineItem[],
  deliveryCost: number,
  freeDeliveryEnabled: boolean,
): DeliveryDistributionResult {
  const baseTotals = items.map(calculateBaseLineTotal);
  const subtotal = baseTotals.reduce((sum, value) => sum + value, 0);

  const deliveryDistributed = freeDeliveryEnabled && deliveryCost > 0 && subtotal > 0;

  const calculated: LineItemCalculated[] = items.map((item, index) => {
    const baseLineTotal = baseTotals[index];
    const deliverySurcharge = deliveryDistributed ? (baseLineTotal / subtotal) * deliveryCost : 0;
    return {
      ...item,
      baseLineTotal,
      deliverySurcharge,
      finalLineTotal: baseLineTotal + deliverySurcharge,
    };
  });

  return { items: calculated, deliveryDistributed };
}

export function calculateQuote(items: LineItem[], settings: QuoteSettings): QuoteCalculationResult {
  const { items: calculatedItems, deliveryDistributed } = distributeDelivery(
    items,
    settings.deliveryCost,
    settings.freeDeliveryEnabled,
  );

  const subtotalBeforeDelivery = calculatedItems.reduce((sum, item) => sum + item.baseLineTotal, 0);
  const deliveryCostTotal = deliveryDistributed ? 0 : settings.deliveryCost;
  const subtotalAfterDelivery =
    calculatedItems.reduce((sum, item) => sum + item.finalLineTotal, 0) +
    (deliveryDistributed ? 0 : deliveryCostTotal);

  const vatAmount = settings.vatEnabled ? (subtotalAfterDelivery * settings.vatRate) / 100 : 0;
  const grandTotal = subtotalAfterDelivery + vatAmount;

  return {
    items: calculatedItems,
    subtotalBeforeDelivery,
    deliveryCostTotal,
    deliveryDistributed,
    subtotalAfterDelivery,
    vatAmount,
    grandTotal,
  };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export interface QuoteValidationError {
  field: string;
  message: string;
}

export function validateQuote(items: LineItem[]): QuoteValidationError[] {
  const errors: QuoteValidationError[] = [];

  if (items.length === 0) {
    errors.push({ field: "items", message: "Добавьте хотя бы одну позицию сметы" });
    return errors;
  }

  items.forEach((item, index) => {
    if (!item.name.trim()) {
      errors.push({ field: `items.${index}.name`, message: `Позиция ${index + 1}: укажите наименование` });
    }
    if (item.quantity < 0) {
      errors.push({ field: `items.${index}.quantity`, message: `Позиция ${index + 1}: количество не может быть отрицательным` });
    }
    if (item.unitPrice < 0) {
      errors.push({ field: `items.${index}.unitPrice`, message: `Позиция ${index + 1}: цена не может быть отрицательной` });
    }
  });

  return errors;
}
