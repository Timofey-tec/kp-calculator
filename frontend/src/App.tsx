import { useMemo, useReducer, useState } from "react";

import { ClientInfoForm } from "./components/ClientInfoForm";
import { GenerateContractButton } from "./components/GenerateContractButton";
import { HistoryPanel } from "./components/HistoryPanel";
import { QuoteItemsTable } from "./components/QuoteItemsTable";
import { QuoteSettingsPanel } from "./components/QuoteSettingsPanel";
import { QuoteSummary } from "./components/QuoteSummary";
import { createSampleQuoteState } from "./data/sampleQuote";
import { calculateQuote, validateQuote } from "./logic/quoteCalculations";
import { createInitialQuoteState, quoteReducer } from "./state/quoteReducer";

function App() {
  const [state, dispatch] = useReducer(quoteReducer, undefined, createInitialQuoteState);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const calculation = useMemo(
    () => calculateQuote(state.items, state.settings),
    [state.items, state.settings],
  );

  const validationErrors = useMemo(() => validateQuote(state.items), [state.items]);
  const isClientInfoMissing = !state.client.companyName.trim() || !state.client.contactPerson.trim();

  const disabledReason = validationErrors.length > 0
    ? validationErrors[0].message
    : isClientInfoMissing
      ? "Укажите название компании и контактное лицо"
      : undefined;

  return (
    <div className="min-h-screen bg-ink-50 pb-16">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="font-serif text-2xl text-ink-900">Калькулятор КП</h1>
            <p className="text-sm text-ink-400">Расчёт сметы и автогенерация договора</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "LOAD_STATE", state: createSampleQuoteState() })}
            className="rounded-md border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-accent-400 hover:text-accent-700"
          >
            Загрузить пример
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ClientInfoForm client={state.client} dispatch={dispatch} />
          <QuoteItemsTable items={state.items} calculatedItems={calculation.items} dispatch={dispatch} />
        </div>

        <div className="space-y-6">
          <QuoteSettingsPanel settings={state.settings} dispatch={dispatch} />
          <QuoteSummary result={calculation} settings={state.settings} />
          <GenerateContractButton
            state={state}
            disabled={Boolean(disabledReason)}
            disabledReason={disabledReason}
            onGenerated={() => setHistoryRefreshKey((key) => key + 1)}
          />
        </div>

        <div className="lg:col-span-3">
          <HistoryPanel refreshKey={historyRefreshKey} />
        </div>
      </main>
    </div>
  );
}

export default App;
