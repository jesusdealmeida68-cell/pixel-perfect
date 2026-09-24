import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Field, TextInput, TextArea, Select, PrimaryButton } from "@/components/Field";
import { useCompany, useUpsertCompany } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES } from "@/lib/bdo";

export const Route = createFileRoute("/empresa")({
  head: () => ({
    meta: [
      { title: "Empresa — Gestão Fácil" },
      { name: "description", content: "Dados do negócio, moeda e definições da conta." },
    ],
  }),
  component: EmpresaPage,
});

function emptyForm() {
  return {
    name: "",
    owner_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    website: "",
    currency: "EUR",
    default_terms: "",
  };
}

function EmpresaPage() {
  const { data: company, isLoading } = useCompany();
  const { user } = useAuth();
  const upsert = useUpsertCompany();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        owner_name: company.owner_name ?? "",
        phone: company.phone ?? "",
        whatsapp: company.whatsapp ?? "",
        email: company.email ?? "",
        address: company.address ?? "",
        website: company.website ?? "",
        currency: company.currency ?? "EUR",
        default_terms: company.default_terms ?? "",
      });
    }
  }, [company]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Indique o nome do negócio.");
      return;
    }
    setSaving(true);
    try {
      await upsert.mutateAsync(form);
      toast.success("Dados da empresa guardados.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <p className="label-caps">A carregar…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Definições" title="A sua empresa" />

      <form onSubmit={submit} className="rounded-lg ring-1 ring-black/5 bg-card p-4 space-y-3">
        <Field label="Nome do negócio">
          <TextInput
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex.: Studio Almeida"
          />
        </Field>
        <Field label="O seu nome">
          <TextInput value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Telefone">
            <TextInput
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+244…"
            />
          </Field>
          <Field label="WhatsApp">
            <TextInput
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+244…"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="E-mail">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Moeda">
            <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Morada / website (opcional)">
          <TextInput
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="www.exemplo.com"
          />
        </Field>
        <Field label="Condições padrão (aparecem nos documentos)">
          <TextArea
            value={form.default_terms}
            onChange={(e) => set("default_terms", e.target.value)}
            placeholder="Ex.: Pagamento em 2 partes: 50% no início, 50% na entrega."
          />
        </Field>
        <PrimaryButton type="submit" disabled={saving} className="w-full">
          {saving ? "A guardar…" : "Guardar dados"}
        </PrimaryButton>
      </form>

      <div className="rounded-lg ring-1 ring-black/5 bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Conta</p>
          <p className="text-xs text-ink-3">{user?.email ?? user?.phone}</p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
          className="text-sm text-destructive font-medium"
        >
          Sair
        </button>
      </div>

      <Link to="/financas" className="block text-center text-xs text-gold font-medium pt-1">
        Ver finanças do negócio →
      </Link>
    </AppShell>
  );
}
