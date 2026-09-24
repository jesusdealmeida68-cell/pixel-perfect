import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useActivities, useClients, useCompany, useDocuments, useJobs } from "@/hooks/useData";
import { formatDateTime, formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Gestão Fácil" },
      {
        name: "description",
        content: "Visão geral de clientes, trabalhos e valores no Gestão Fácil.",
      },
      { property: "og:title", content: "Painel — Gestão Fácil" },
      {
        property: "og:description",
        content: "Visão geral de clientes, trabalhos e valores no Gestão Fácil.",
      },
    ],
  }),
  component: Dashboard,
});

function Metric({ label, value, tone }: { label: string; value: string; tone?: "gold" }) {
  return (
    <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
      <p className="text-xs text-ink-3">{label}</p>
      <p
        className={`font-mono text-2xl font-semibold tabular-nums mt-1 ${tone === "gold" ? "text-gold" : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Dashboard() {
  const { data: clients = [] } = useClients();
  const { data: jobs = [] } = useJobs();
  const { data: documents = [] } = useDocuments();
  const { data: activities = [] } = useActivities(8);
  const { data: company } = useCompany();
  const currency = company?.currency ?? "EUR";

  const negotiating = clients.filter((c) => c.status === "negociacao").length;
  const running = jobs.filter((j) => j.status === "andamento").length;
  const done = jobs.filter((j) => j.status === "concluido").length;
  const received = jobs.reduce((s, j) => s + Number(j.paid_amount || 0), 0);
  const pending = jobs
    .filter((j) => j.status !== "cancelado")
    .reduce((s, j) => s + Math.max(Number(j.amount || 0) - Number(j.paid_amount || 0), 0), 0);

  const today = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <AppShell>
      <PageHeader
        eyebrow={`Painel · ${today}`}
        title={company?.owner_name ? `Bom dia, ${company.owner_name.split(" ")[0]}` : "Painel geral"}
        action={
          <Link
            to="/clientes"
            search={{ novo: true }}
            className="inline-flex items-center gap-1.5 bg-ink text-ivory rounded-md py-2 px-3 text-sm font-medium ring-1 ring-black/5 shrink-0"
          >
            <span className="font-mono leading-none">+</span> Novo cliente / trabalho
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-2">
        <Link
          to="/diagnostico"
          className="flex items-center gap-2 bg-ink text-ivory rounded-lg p-3.5 text-sm font-medium ring-1 ring-black/5"
        >
          <span className="font-mono text-gold">＋</span> Criar diagnóstico
        </Link>
        <Link
          to="/clientes"
          search={{ novo: true }}
          className="flex items-center gap-2 bg-card ring-1 ring-black/5 rounded-lg p-3.5 text-sm font-medium"
        >
          <span className="font-mono text-gold">＋</span> Guardar cliente
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Metric label="Clientes" value={String(clients.length)} />
        <Metric label="Em negociação" value={String(negotiating)} />
        <Metric label="Em andamento" value={String(running)} />
        <Metric label="Concluídos" value={String(done)} />
        <div className="col-span-2 grid grid-cols-2 divide-x divide-line bg-ivory-2/70 ring-1 ring-black/5 rounded-lg overflow-hidden">
          <div className="p-4">
            <p className="text-xs text-ink-3">Recebido</p>
            <p className="font-mono text-xl font-semibold text-gold tabular-nums mt-1">
              {formatMoney(received, currency)}
            </p>
          </div>
          <div className="p-4">
            <p className="text-xs text-ink-3">Pendente</p>
            <p className="font-mono text-xl font-semibold tabular-nums mt-1">
              {formatMoney(pending, currency)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-display text-lg font-bold">Actividade recente</h2>
          <Link to="/documentos" className="text-xs text-gold font-medium">
            Ver documentos
          </Link>
        </div>
        {activities.length === 0 ? (
          <div className="rounded-lg ring-1 ring-black/5 bg-card p-6 text-center text-sm text-ink-3">
            Ainda sem actividade. Comece por registar um cliente.
          </div>
        ) : (
          <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
            {activities.map((a) => (
              <li key={a.id} className="p-3 flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-gold shrink-0" />
                <p className="text-sm flex-1 min-w-0 truncate">{a.message}</p>
                <span className="text-xs text-ink-3 font-mono tabular-nums shrink-0">
                  {formatDateTime(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-display text-lg font-bold">Últimos documentos</h2>
          <span className="text-xs text-ink-3 font-mono tabular-nums">{documents.length}</span>
        </div>
        {documents.length === 0 ? (
          <div className="rounded-lg ring-1 ring-black/5 bg-card p-6 text-center text-sm text-ink-3">
            Nenhum documento criado.
          </div>
        ) : (
          <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
            {documents.slice(0, 4).map((d) => (
              <li key={d.id}>
                <Link
                  to="/documentos/$id"
                  params={{ id: d.id }}
                  className="p-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{d.title || d.number}</p>
                    <p className="text-xs text-ink-3 font-mono tabular-nums">{d.number}</p>
                  </div>
                  <span className="font-mono text-sm font-medium tabular-nums shrink-0">
                    {formatMoney(d.total, currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
