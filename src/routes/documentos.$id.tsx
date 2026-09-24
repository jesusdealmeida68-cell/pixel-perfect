import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, ArrowLeft } from "lucide-react";
import { AppShell, PageHeader, Chip } from "@/components/AppShell";
import { useDocument, useCompany, useClient } from "@/hooks/useData";
import { DOC_KIND, formatDate, formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/documentos/$id")({
  head: () => ({
    meta: [{ title: "Documento — Gestão Fácil" }],
  }),
  component: DocumentoDetalhe,
});

function DocumentoDetalhe() {
  const { id } = Route.useParams();
  const { data: doc, isLoading } = useDocument(id);
  const { data: company } = useCompany();
  const { data: client } = useClient(doc?.client_id ?? "");
  const currency = company?.currency ?? "EUR";

  if (isLoading) {
    return (
      <AppShell>
        <p className="label-caps">A carregar…</p>
      </AppShell>
    );
  }
  if (!doc) {
    return (
      <AppShell>
        <div className="rounded-lg ring-1 ring-black/5 bg-card p-8 text-center">
          <p className="font-display text-base font-bold">Documento não encontrado</p>
          <Link to="/documentos" className="text-xs text-gold font-medium mt-2 inline-block">
            Voltar aos documentos
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3 no-print">
        <Link to="/documentos" className="inline-flex items-center gap-1.5 text-sm text-ink-3">
          <ArrowLeft className="size-4" /> Documentos
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-ink text-ivory rounded-md py-2 px-3 text-sm font-medium ring-1 ring-black/5"
        >
          <Printer className="size-4" /> Imprimir / PDF
        </button>
      </div>

      <div className="print-sheet rounded-lg ring-1 ring-black/5 bg-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-line">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gold font-medium">
              {DOC_KIND[doc.kind as keyof typeof DOC_KIND] ?? doc.kind}
            </p>
            <h1 className="font-display text-2xl font-bold mt-1">{doc.title || doc.service}</h1>
            <p className="text-xs text-ink-3 font-mono mt-1">
              {doc.number} · {formatDate(doc.issue_date)}
            </p>
          </div>
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="size-12 rounded-md object-cover ring-1 ring-black/5"
            />
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-6 py-5 border-b border-line text-sm">
          <div>
            <p className="label-caps mb-1">De</p>
            <p className="font-medium">{company?.name ?? "A sua empresa"}</p>
            {company?.owner_name ? <p className="text-ink-3">{company.owner_name}</p> : null}
            {company?.phone ? <p className="text-ink-3">{company.phone}</p> : null}
            {company?.email ? <p className="text-ink-3">{company.email}</p> : null}
          </div>
          <div>
            <p className="label-caps mb-1">Para</p>
            <p className="font-medium">{client?.full_name ?? "Cliente"}</p>
            {client?.phone ? <p className="text-ink-3">{client.phone}</p> : null}
            {client?.email ? <p className="text-ink-3">{client.email}</p> : null}
          </div>
        </div>

        {doc.diagnosis ? (
          <div className="py-5 border-b border-line">
            <p className="label-caps mb-2">Diagnóstico</p>
            <p className="text-sm text-ink-2 leading-relaxed">{doc.diagnosis}</p>
          </div>
        ) : null}

        {doc.items?.length ? (
          <div className="py-5 border-b border-line">
            <p className="label-caps mb-2">Itens</p>
            <ul className="divide-y divide-line">
              {doc.items.map((item, i) => (
                <li key={i} className="py-2 flex items-center justify-between text-sm">
                  <span>{item.description}</span>
                  <span className="font-mono tabular-nums">
                    {formatMoney(item.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="pt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {doc.deadline ? <Chip label={`Prazo: ${doc.deadline}`} tone="muted" /> : null}
            {doc.payment_method ? <Chip label={doc.payment_method} tone="muted" /> : null}
          </div>
          <div className="text-right">
            <p className="label-caps">Total</p>
            <p className="font-mono text-2xl font-bold text-gold tabular-nums">
              {formatMoney(doc.total, currency)}
            </p>
          </div>
        </div>

        {doc.conditions || doc.notes ? (
          <div className="pt-5 mt-5 border-t border-line text-xs text-ink-3 space-y-1">
            {doc.conditions ? <p>{doc.conditions}</p> : null}
            {doc.notes ? <p>{doc.notes}</p> : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
