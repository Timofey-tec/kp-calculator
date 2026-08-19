import { type Dispatch, type KeyboardEvent, useRef } from "react";

import { formatMoney } from "../logic/quoteCalculations";
import type { QuoteAction } from "../state/quoteReducer";
import type { LineItem, LineItemCalculated } from "../types/quote";

interface Props {
  items: LineItem[];
  calculatedItems: LineItemCalculated[];
  dispatch: Dispatch<QuoteAction>;
}

const FIELD_ORDER: (keyof LineItem)[] = ["name", "quantity", "unitPrice", "discountPercent"];

export function QuoteItemsTable({ items, calculatedItems, dispatch }: Props) {
  const inputRefs = useRef(new Map<string, HTMLInputElement>());

  const setInputRef = (rowIndex: number, field: keyof LineItem) => (el: HTMLInputElement | null) => {
    const key = `${rowIndex}:${field}`;
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  };

  const focusCell = (rowIndex: number, field: keyof LineItem) => {
    inputRefs.current.get(`${rowIndex}:${field}`)?.focus();
  };

  const handleKeyDown = (rowIndex: number, field: keyof LineItem) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const isLastRow = rowIndex === items.length - 1;
    if (isLastRow) {
      dispatch({ type: "ADD_ITEM" });
      // фокус на ту же колонку в новой строке после её появления в DOM
      requestAnimationFrame(() => focusCell(rowIndex + 1, field));
    } else {
      focusCell(rowIndex + 1, field);
    }
  };

  const updateField = (id: string, field: keyof LineItem, value: string | number) =>
    dispatch({ type: "UPDATE_ITEM_FIELD", id, field, value });

  return (
    <section className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink-900">Смета</h2>
        <button
          type="button"
          onClick={() => dispatch({ type: "ADD_ITEM" })}
          className="rounded-md border border-accent-200 bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-700 transition hover:bg-accent-100"
        >
          + Добавить позицию
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="w-2/5 py-2 pr-2">Наименование</th>
              <th className="py-2 pr-2">Кол-во</th>
              <th className="py-2 pr-2">Цена, ₽</th>
              <th className="py-2 pr-2">Скидка, %</th>
              <th className="py-2 pr-2 text-right">Сумма, ₽</th>
              <th className="w-8 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIndex) => {
              const calculated = calculatedItems[rowIndex];
              return (
                <tr key={item.id} className="border-b border-ink-100 last:border-0">
                  {FIELD_ORDER.map((field) => (
                    <td key={field} className="py-1.5 pr-2">
                      <input
                        ref={setInputRef(rowIndex, field)}
                        type={field === "name" ? "text" : "number"}
                        min={field === "name" ? undefined : 0}
                        value={item[field]}
                        onChange={(e) =>
                          updateField(
                            item.id,
                            field,
                            field === "name" ? e.target.value : Math.max(0, Number(e.target.value)),
                          )
                        }
                        onKeyDown={handleKeyDown(rowIndex, field)}
                        className="w-full rounded border border-transparent bg-ink-50 px-2 py-1.5 text-ink-900 outline-none transition focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-100"
                      />
                    </td>
                  ))}
                  <td className="py-1.5 pr-2 text-right tabular-nums text-ink-700">
                    {calculated ? formatMoney(calculated.finalLineTotal) : "—"}
                  </td>
                  <td className="py-1.5 text-center">
                    <button
                      type="button"
                      aria-label="Удалить позицию"
                      onClick={() => dispatch({ type: "REMOVE_ITEM", id: item.id })}
                      className="text-ink-300 transition hover:text-red-500"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
