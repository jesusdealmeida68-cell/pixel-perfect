import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, PageHeader, Empty } from "@/components/AppShell";
import { useJobs, useDocuments, useCompany } from "@/hooks/useData";
import { formatDate, formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/financas")({
  head: () => ({
    meta: [
      { title: "Finanças — Gestão Fácil" },
      { name: "description", content: "Entradas, saídas, valores a receber e lucro do negócio." },
    ],
  }),
  component: FinancasPage,
});

function FinancasPage() {
  const { data: jobs = [], isLoading } = useJobs();
  const { data: documents = [] } = useDocuments();
  const { data: company } = useCompany();
  const currency = company?.currency ?? "EUR";

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status !== "cancelado");
    const entradas = activeJobs.reduce((s, j) => s + Number(j.paid_amount || 0), 0);
    const total = activeJobs.reduce((s, j) => s + Number(j.amount || 0), 0);
    const pendente = Math.max(total - entradas, 0);
    const concluidos = jobs.filter((j) => j.status === "concluido").length;
    return { entradas, pendente, total, concluidos };
  }, [jobs]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    for (const j of jobs) {
      if (j.status === "cancelado") continue;
      const key = new Intl.DateTimeFormat("pt-PT", { month: "short", year: "2-digit" }).format(
        new Date(j.created_at),
      );
      map.set(key, (map.get(key) ?? 0) + Number(j.paid_amount || 0));
    }
    return Array.from(map.entries()).slice(-6);
  }, [jobs]);

  const maxMonthly = Math.max(1, ...monthly.map(([, v]) => v));

  return (
    <AppShell>
      <PageHeader eyebrow="Visão geral" title="Finanças" />

      {isLoading ? (
        <p className="label-caps">A carregar…</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
              <p className="text-xs text-ink-3">Entradas</p>
              <p className="font-mono text-xl font-semibold text-gold tabular-nums mt-1">
                {formatMoney(stats.entradas, currency)}
              </p>
            </div>
            <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
              <p className="text-xs text-ink-3">A receber</p>
              <p className="font-mono text-xl font-semibold tabular-nums mt-1">
                {formatMoney(stats.pendente, currency)}
              </p>
            </div>
            <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
              <p className="text-xs text-ink-3">Valor total em carteira</p>
              <p className="font-mono text-xl font-semibold tabular-nums mt-1">
                {formatMoney(stats.total, currency)}
              </p>
            </div>
            <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
              <p className="text-xs text-ink-3">Trabalhos concluídos</p>
              <p className="font-mono text-xl font-semibold tabular-nums mt-1">
                {stats.concluidos}
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">Recebido por mês</h2>
            {monthly.length === 0 ? (
              <Empty
                title="Sem dados suficientes"
                hint="Os valores aparecem à medida que regista pagamentos."
              />
            ) : (
              <div className="bg-card ring-1 ring-black/5 rounded-lg p-4 flex items-end gap-3 h-40">
                {monthly.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono text-ink-3 tabular-nums">
                      {value > 0 ? formatMoney(value, currency) : ""}
                    </span>
                    <div
                      className="w-full max-w-8 rounded-t-sm bg-gradient-to-t from-ink to-gold"
                      style={{ height: `${Math.max((value / maxMonthly) * 100, 4)}%` }}
                    />
                    <span className="text-[10px] text-ink-3 uppercase">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">Últimos documentos com valor</h2>
            {documents.length === 0 ? (
              <Empty title="Nenhum documento ainda" />
            ) : (
              <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
                {documents.slice(0, 6).map((d) => (
                  <li key={d.id} className="p-3 flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{d.title || d.number}</p>
                      <p className="text-xs text-ink-3">{formatDate(d.issue_date)}</p>
                    </div>
                    <span className="font-mono tabular-nums shrink-0">
                      {formatMoney(d.total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
