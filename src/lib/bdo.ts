export type ClientStatus = "ativo" | "negociacao" | "sem_contrato" | "antigo";
export type JobStatus =
  | "negociacao"
  | "aguardando_pagamento"
  | "andamento"
  | "concluido"
  | "cancelado";
export type DocKind = "diagnostico" | "orcamento" | "proposta" | "contrato";

export const CLIENT_STATUS: Record<ClientStatus, string> = {
  ativo: "Cliente activo",
  negociacao: "Em negociação",
  sem_contrato: "Ainda não contratou",
  antigo: "Cliente antigo",
};

export const JOB_STATUS: Record<JobStatus, string> = {
  negociacao: "Em negociação",
  aguardando_pagamento: "Aguarda pagamento",
  andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const DOC_KIND: Record<DocKind, string> = {
  diagnostico: "Diagnóstico",
  orcamento: "Orçamento",
  proposta: "Proposta comercial",
  contrato: "Contrato",
};

export const CURRENCIES = ["EUR", "AOA", "BRL", "USD", "GBP"] as const;

export function formatMoney(value: number | string | null | undefined, currency = "EUR") {
  const n = Number(value ?? 0);
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export type DocItem = { description: string; amount: number };

export function computeTotal(input: {
  items?: DocItem[];
  base_price?: number | string;
  fees?: number | string;
  discount?: number | string;
  other_costs?: number | string;
}) {
  const items = (input.items ?? []).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  return (
    items +
    Number(input.base_price || 0) +
    Number(input.fees || 0) +
    Number(input.other_costs || 0) -
    Number(input.discount || 0)
  );
}

export function initials(name?: string | null) {
  if (!name) return "—";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
