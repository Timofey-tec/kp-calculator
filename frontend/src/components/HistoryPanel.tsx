import { useEffect, useState } from "react";

import { downloadHistoryQuote, fetchHistory, triggerBrowserDownload } from "../api/client";
import { formatMoney } from "../logic/quoteCalculations";
import type { QuoteHistoryItem } from "../types/quote";

interface Props {
  refreshKey: number;
}

export function HistoryPanel({ refreshKey }: Props) {
  const [items, setItems] = useState<QuoteHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistory()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Не удалось загрузить историю");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      const { blob, filename } = await downloadHistoryQuote(id);
      triggerBrowserDownload(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось скачать файл");
    } finally {
      setDownloadingId(null);
    }
  };

  if (error) {
    return (
      <section className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
        <h2 className="mb-2 font-serif text-lg text-ink-900">История КП</h2>
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
      <h2 className="mb-4 font-serif text-lg text-ink-900">История КП</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-400">Сформированных КП пока нет.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <div>
                <p className="font-medium text-ink-800">{item.companyName}</p>
                <p className="text-xs text-ink-400">
                  {item.contactPerson} · {new Date(item.createdAt).toLocaleString("ru-RU")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-ink-600">{formatMoney(item.totalAmount)} ₽</span>
                <button
                  type="button"
                  onClick={() => handleDownload(item.id)}
                  disabled={downloadingId === item.id}
                  className="rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:border-accent-400 hover:text-accent-700 disabled:opacity-50"
                >
                  {downloadingId === item.id ? "…" : "Скачать"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
