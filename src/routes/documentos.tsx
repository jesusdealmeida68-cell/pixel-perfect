import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell, PageHeader, Chip, Empty } from "@/components/AppShell";
import { useDocuments, useCompany, useClients } from "@/hooks/useData";
import { DOC_KIND, formatDate, formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos — Gestão Fácil" },
      { name: "description", content: "Diagnósticos, orçamentos, propostas e contratos gerados." },
    ],
  }),
  component: DocumentosPage,
});

function kindTone(kind: string) {
  if (kind === "proposta" || kind === "contrato") return "gold" as const;
  if (kind === "diagnostico") return "muted" as const;
  return "ink" as const;
}

function DocumentosPage() {
  const { data: documents = [], isLoading } = useDocuments();
  const { data: company } = useCompany();
  const { data: clients = [] } = useClients();
  const currency = company?.currency ?? "EUR";
  const [query, setQuery] = useState("");

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.full_name;

  const filtered = useMemo(() => {
    if (!query.trim()) return documents;
    const q = query.toLowerCase();
    return documents.filter(
      (d) =>
        (d.title ?? "").toLowerCase().includes(q) ||
        d.number.toLowerCase().includes(q) ||
        (d.service ?? "").toLowerCase().includes(q),
    );
  }, [documents, query]);

  return (
    <AppShell>
      <PageHeader eyebrow={`${documents.length} documentos`} title="Documentos" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar documento…"
          className="w-full rounded-md bg-card border border-line pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {isLoading ? (
        <p className="label-caps">A carregar…</p>
      ) : filtered.length === 0 ? (
        <Empty
          title={documents.length === 0 ? "Ainda sem documentos" : "Nenhum resultado"}
          hint="Crie um diagnóstico para gerar o primeiro documento."
        />
      ) : (
        <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
          {filtered.map((d) => (
            <li key={d.id}>
              <Link
                to="/documentos/$id"
                params={{ id: d.id }}
                className="p-3 flex items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.title || d.service || d.number}</p>
                  <p className="text-xs text-ink-3 font-mono truncate">
                    {d.number} · {formatDate(d.issue_date)}
                    {clientName(d.client_id) ? ` · ${clientName(d.client_id)}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-mono text-sm font-medium tabular-nums">
                    {formatMoney(d.total, currency)}
                  </span>
                  <Chip
                    label={DOC_KIND[d.kind as keyof typeof DOC_KIND] ?? d.kind}
                    tone={kindTone(d.kind)}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
