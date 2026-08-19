import type { Dispatch } from "react";

import type { QuoteAction } from "../state/quoteReducer";
import type { ClientInfo } from "../types/quote";

interface Props {
  client: ClientInfo;
  dispatch: Dispatch<QuoteAction>;
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-ink-600">
        {label}
        {required && <span className="text-accent-600"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-900 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
      />
    </label>
  );
}

export function ClientInfoForm({ client, dispatch }: Props) {
  const update = (field: keyof ClientInfo) => (value: string) =>
    dispatch({ type: "UPDATE_CLIENT_FIELD", field, value });

  return (
    <section className="rounded-lg border border-ink-100 bg-white p-5 shadow-card">
      <h2 className="mb-4 font-serif text-lg text-ink-900">Данные клиента</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Название компании" value={client.companyName} onChange={update("companyName")} required />
        <Field label="ИНН" value={client.inn} onChange={update("inn")} />
        <Field label="Контактное лицо" value={client.contactPerson} onChange={update("contactPerson")} required />
        <Field label="Телефон" value={client.phone} onChange={update("phone")} />
        <Field label="Email" value={client.email} onChange={update("email")} type="email" />
      </div>
    </section>
  );
}
