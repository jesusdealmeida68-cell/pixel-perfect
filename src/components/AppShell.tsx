import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useData";
import { initials } from "@/lib/bdo";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/clientes", label: "Clientes" },
  { to: "/trabalhos", label: "Trabalhos" },
  { to: "/documentos", label: "Documentos" },
  { to: "/empresa", label: "Empresa" },
] as const;

export function Brand({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="grid place-items-center size-8 rounded-md bg-ink ring-1 ring-black/5 shrink-0">
        <span className="font-display text-gold-2 text-sm leading-none">B</span>
      </span>
      <span
        className={`font-display font-bold tracking-tight truncate ${
          size === "lg" ? "text-xl" : "text-[15px]"
        }`}
      >
        Bellucci d&rsquo;Oro
      </span>
    </div>
  );
}

function SignedOut() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm text-center">
        <Brand size="lg" />
        <h1 className="font-display text-2xl font-bold mt-6">Sessão necessária</h1>
        <p className="text-sm text-ink-3 mt-2">
          Entre na sua conta para aceder aos clientes, trabalhos e documentos.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-ink text-ivory px-4 py-2 text-sm font-medium"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { data: company } = useCompany();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="label-caps">A carregar…</p>
      </div>
    );
  }
  if (!user) return <SignedOut />;

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <header className="sticky top-0 z-30 bg-ivory/95 backdrop-blur-sm border-b border-line no-print">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/">
            <Brand />
          </Link>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="text-xs text-ink-3 hover:text-ink"
            >
              Sair
            </button>
            <span className="grid place-items-center size-8 rounded-full bg-gold text-ivory text-[11px] font-semibold font-mono ring-1 ring-black/5">
              {initials(company?.owner_name || user.email || "BD")}
            </span>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex items-center gap-5 overflow-x-auto whitespace-nowrap">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="py-3 text-sm text-ink-3 border-b-2 border-transparent"
              activeProps={{ className: "py-3 text-sm font-medium text-ink border-b-2 border-gold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] text-gold font-medium">{eyebrow}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight mt-1 text-balance">
          {title}
        </h1>
      </div>
      {action}
    </section>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg ring-1 ring-black/5 bg-card p-8 text-center">
      <p className="font-display text-base font-bold">{title}</p>
      {hint ? <p className="text-sm text-ink-3 mt-1">{hint}</p> : null}
    </div>
  );
}

export function Chip({ label, tone = "muted" }: { label: string; tone?: "gold" | "ink" | "muted" }) {
  const tones = {
    gold: "text-gold bg-gold/10 ring-gold/20",
    ink: "text-ink-2 bg-ink-2/10 ring-ink-2/20",
    muted: "text-ink-3 bg-ink-3/10 ring-ink-3/20",
  } as const;
  return (
    <span
      className={`text-[11px] font-medium rounded-full px-2 py-0.5 ring-1 shrink-0 ${tones[tone]}`}
    >
      {label}
    </span>
  );
}
