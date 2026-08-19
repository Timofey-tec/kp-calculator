import { formatMoney } from "../logic/quoteCalculations";
import type { QuoteCalculationResult, QuoteSettings } from "../types/quote";

interface Props {
  result: QuoteCalculationResult;
  settings: QuoteSettings;
}

export function QuoteSummary({ result, settings }: Props) {
  return (
    <section className="rounded-lg border border-ink-100 bg-ink-900 p-5 text-ink-50 shadow-card">
      <h2 className="mb-4 font-serif text-lg">Итого</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-ink-200">
          <dt>Сумма по позициям</dt>
          <dd className="tabular-nums">{formatMoney(result.subtotalBeforeDelivery)} ₽</dd>
        </div>

        {result.deliveryDistributed ? (
          <div className="flex justify-between text-ink-200">
            <dt>Доставка</dt>
            <dd className="tabular-nums text-accent-400">включена в позиции</dd>
          </div>
        ) : (
          settings.deliveryCost > 0 && (
            <div className="flex justify-between text-ink-200">
              <dt>Доставка</dt>
              <dd className="tabular-nums">{formatMoney(result.deliveryCostTotal)} ₽</dd>
            </div>
          )
        )}

        {settings.vatEnabled && (
          <div className="flex justify-between text-ink-200">
            <dt>НДС ({settings.vatRate}%)</dt>
            <dd className="tabular-nums">{formatMoney(result.vatAmount)} ₽</dd>
          </div>
        )}

        <div className="mt-2 flex justify-between border-t border-ink-700 pt-3 text-base font-semibold">
          <dt>К оплате</dt>
          <dd className="tabular-nums text-accent-400">{formatMoney(result.grandTotal)} ₽</dd>
        </div>
      </dl>
    </section>
  );
}
