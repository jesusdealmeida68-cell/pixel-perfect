import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Wallet, Sparkles, Building2, ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/mais")({
  head: () => ({ meta: [{ title: "Mais — Gestão Fácil" }] }),
  component: MaisPage,
});

const ITEMS = [
  {
    to: "/documentos",
    label: "Documentos",
    hint: "Propostas, orçamentos e contratos",
    icon: FileText,
  },
  { to: "/financas", label: "Finanças", hint: "Entradas, saídas e lucro", icon: Wallet },
  { to: "/assistente", label: "Assistente", hint: "Pergunte sobre os seus dados", icon: Sparkles },
  { to: "/empresa", label: "Empresa", hint: "Dados do negócio e conta", icon: Building2 },
] as const;

function MaisPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Mais opções" title="Mais" />
      <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link to={item.to} className="p-3.5 flex items-center gap-3">
                <span className="grid place-items-center size-9 rounded-md bg-gold/10 text-gold shrink-0">
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-ink-3">{item.hint}</p>
                </div>
                <ChevronRight className="size-4 text-ink-3 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
