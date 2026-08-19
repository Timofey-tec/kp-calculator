import type { QuoteCalculationResult, QuoteHistoryItem, QuoteState } from "../types/quote";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: { msg?: string }) => e.msg).join("; ");
    }
  } catch {
    // тело не JSON — используем статус-текст
  }
  return `Ошибка запроса (${response.status})`;
}

function toQuoteInput(state: QuoteState) {
  return {
    client: state.client,
    items: state.items,
    settings: state.settings,
  };
}

export async function calculateQuoteOnServer(state: QuoteState): Promise<QuoteCalculationResult> {
  const response = await fetch(`${API_BASE_URL}/api/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toQuoteInput(state)),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

function extractFilename(response: Response, fallback: string): string {
  const header = response.headers.get("Content-Disposition") ?? "";
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  if (plainMatch) return plainMatch[1];
  return fallback;
}

export async function generateContract(state: QuoteState): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${API_BASE_URL}/api/contract/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toQuoteInput(state)),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  const blob = await response.blob();
  return { blob, filename: extractFilename(response, "dogovor.docx") };
}

export async function fetchHistory(): Promise<QuoteHistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/quotes`);
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return response.json();
}

export async function downloadHistoryQuote(id: number): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${API_BASE_URL}/api/quotes/${id}/download`);
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  const blob = await response.blob();
  return { blob, filename: extractFilename(response, `dogovor_${id}.docx`) };
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
