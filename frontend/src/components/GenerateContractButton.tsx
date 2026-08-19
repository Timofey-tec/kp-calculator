import { useState } from "react";

import { generateContract, triggerBrowserDownload } from "../api/client";
import type { QuoteState } from "../types/quote";

interface Props {
  state: QuoteState;
  disabled: boolean;
  disabledReason?: string;
  onGenerated: () => void;
}

type Feedback = { kind: "success"; filename: string } | { kind: "error"; message: string } | null;

export function GenerateContractButton({ state, disabled, disabledReason, onGenerated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const { blob, filename } = await generateContract(state);
      triggerBrowserDownload(blob, filename);
      setFeedback({ kind: "success", filename });
      onGenerated();
    } catch (error) {
      setFeedback({ kind: "error", message: error instanceof Error ? error.message : "Неизвестная ошибка" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        title={disabled ? disabledReason : undefined}
        className="w-full rounded-md bg-accent-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-400"
      >
        {isLoading ? "Формируем договор…" : "Сформировать договор (.docx)"}
      </button>

      {disabled && disabledReason && (
        <p className="text-xs text-ink-400">{disabledReason}</p>
      )}

      {feedback?.kind === "success" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Готово! Файл «{feedback.filename}» скачан.
        </div>
      )}

      {feedback?.kind === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Не удалось сформировать договор: {feedback.message}
        </div>
      )}
    </div>
  );
}
