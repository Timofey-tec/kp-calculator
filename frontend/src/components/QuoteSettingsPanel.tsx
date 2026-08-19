import type { Dispatch } from "react";

import type { QuoteAction } from "../state/quoteReducer";
import type { QuoteSettings } from "../types/quote";

interface Props {
  settings: QuoteSettings;
  dispatch: Dispatch<QuoteAction>;
}

export function QuoteSettingsPanel({ settings, dispatch }: Props) {
  const update = (field: keyof QuoteSettings, value: boolean | number) =>
    dispatch({ type: "UPDATE_SETTINGS_FIELD", field, value });

  return (
    <section className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
      <h2 className="mb-4 font-serif text-lg text-ink-900">Условия</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={settings.vatEnabled}
              onChange={(e) => update("vatEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-400"
            />
            НДС
          </label>
          {settings.vatEnabled && (
            <div className="flex items-center gap-1 text-sm">
              <input
                type="number"
                min={0}
                max={100}
                value={settings.vatRate}
                onChange={(e) => update("vatRate", Math.max(0, Number(e.target.value)))}
                className="w-16 rounded border border-ink-200 bg-ink-50 px-2 py-1 text-right outline-none focus:border-accent-500 focus:bg-white"
              />
              <span className="text-ink-400">%</span>
            </div>
          )}
        </div>

        <hr className="border-ink-100" />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={settings.freeDeliveryEnabled}
              onChange={(e) => update("freeDeliveryEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-accent-600 focus:ring-accent-400"
            />
            Бесплатная доставка
          </label>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="number"
              min={0}
              value={settings.deliveryCost}
              onChange={(e) => update("deliveryCost", Math.max(0, Number(e.target.value)))}
              className="w-24 rounded border border-ink-200 bg-ink-50 px-2 py-1 text-right outline-none focus:border-accent-500 focus:bg-white"
            />
            <span className="text-ink-400">₽</span>
          </div>
        </div>
        {settings.freeDeliveryEnabled && (
          <p className="rounded-md bg-accent-50 px-3 py-2 text-xs leading-relaxed text-accent-800">
            Стоимость доставки не будет показана отдельной строкой — она пропорционально
            распределится по остальным позициям сметы.
          </p>
        )}
      </div>
    </section>
  );
}
