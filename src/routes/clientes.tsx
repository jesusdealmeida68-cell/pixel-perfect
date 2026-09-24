import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X, Phone, MessageCircle } from "lucide-react";
import { AppShell, PageHeader, Chip, Empty } from "@/components/AppShell";
import { Field, TextInput, TextArea, Select, PrimaryButton, GhostButton } from "@/components/Field";
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useLogActivity,
} from "@/hooks/useData";
import type { Client } from "@/hooks/useData";
import { CLIENT_STATUS, formatDate, initials } from "@/lib/bdo";
import { z } from "zod";

const searchSchema = z.object({ novo: z.boolean().optional() });

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Gestão Fácil" },
      { name: "description", content: "Guarde e acompanhe as pessoas com quem está a negociar." },
    ],
  }),
  validateSearch: searchSchema,
  component: ClientesPage,
});

const STATUS_ORDER = ["negociacao", "sem_contrato", "ativo", "antigo"] as const;

function emptyForm() {
  return {
    full_name: "",
    company_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    status: "negociacao",
    notes: "",
  };
}

function ClientForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Client | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          full_name: initial.full_name,
          company_name: initial.company_name ?? "",
          phone: initial.phone ?? "",
          whatsapp: initial.whatsapp ?? "",
          email: initial.email ?? "",
          address: initial.address ?? "",
          status: initial.status,
          notes: initial.notes ?? "",
        }
      : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const create = useCreateClient();
  const update = useUpdateClient();
  const logActivity = useLogActivity();

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Indique o nome do cliente.");
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...form });
        toast.success("Cliente atualizado.");
      } else {
        await create.mutateAsync({
          ...form,
          first_contact_date: new Date().toISOString().slice(0, 10),
        });
        await logActivity.mutateAsync({
          message: `Novo cliente: ${form.full_name}`,
          kind: "cliente",
        });
        toast.success("Cliente guardado.");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Nome">
        <TextInput
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="Ex.: Maria Fernandes"
          autoFocus
        />
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
        <Field label="Empresa (opcional)">
          <TextInput
            value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)}
          />
        </Field>
        <Field label="E-mail (opcional)">
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Estado">
        <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {CLIENT_STATUS[s]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notas">
        <TextArea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Serviço de interesse, valor estimado, contexto…"
        />
      </Field>
      <div className="flex gap-2 pt-1">
        <PrimaryButton type="submit" disabled={saving} className="flex-1">
          {saving ? "A guardar…" : "Guardar"}
        </PrimaryButton>
        <GhostButton type="button" onClick={onCancel}>
          Cancelar
        </GhostButton>
      </div>
    </form>
  );
}

function ClientRow({ client, onEdit }: { client: Client; onEdit: () => void }) {
  const tone =
    client.status === "ativo" ? "gold" : client.status === "sem_contrato" ? "muted" : "ink";
  return (
    <li className="p-3 flex items-center gap-3">
      <span className="grid place-items-center size-9 rounded-full bg-ink-2/10 text-ink-2 text-xs font-semibold font-mono shrink-0">
        {initials(client.full_name)}
      </span>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium truncate">{client.full_name}</p>
        <p className="text-xs text-ink-3 truncate">
          {client.company_name || client.notes || formatDate(client.first_contact_date)}
        </p>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        {client.whatsapp ? (
          <a
            href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="grid place-items-center size-8 rounded-full bg-ivory-2 text-ink-2"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="size-4" />
          </a>
        ) : client.phone ? (
          <a
            href={`tel:${client.phone}`}
            className="grid place-items-center size-8 rounded-full bg-ivory-2 text-ink-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="size-4" />
          </a>
        ) : null}
        <Chip
          label={CLIENT_STATUS[client.status as keyof typeof CLIENT_STATUS] ?? client.status}
          tone={tone}
        />
      </div>
    </li>
  );
}

function ClientesPage() {
  const { novo } = Route.useSearch();
  const { data: clients = [], isLoading } = useClients();
  const deleteClient = useDeleteClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [open, setOpen] = useState(!!novo);
  const [editing, setEditing] = useState<Client | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter !== "todos" && c.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.company_name ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
      );
    });
  }, [clients, query, statusFilter]);

  const showForm = open || !!editing;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${clients.length} ${clients.length === 1 ? "cliente" : "clientes"}`}
        title="Clientes"
        action={
          !showForm ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 bg-ink text-ivory rounded-md py-2 px-3 text-sm font-medium ring-1 ring-black/5 shrink-0"
            >
              <Plus className="size-4" /> Novo
            </button>
          ) : undefined
        }
      />

      {showForm ? (
        <div className="rounded-lg ring-1 ring-black/5 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">
              {editing ? "Editar cliente" : "Novo cliente"}
            </h2>
            <button
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              className="text-ink-3"
            >
              <X className="size-5" />
            </button>
          </div>
          <ClientForm
            initial={editing}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
            onSaved={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
          {editing ? (
            <button
              onClick={async () => {
                if (!confirm("Remover este cliente?")) return;
                await deleteClient.mutateAsync(editing.id);
                toast.success("Cliente removido.");
                setEditing(null);
              }}
              className="text-xs text-ink-3 mt-4 underline underline-offset-2"
            >
              Remover cliente
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar cliente…"
                className="w-full rounded-md bg-card border border-line pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
            {(["todos", ...STATUS_ORDER] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
                  statusFilter === s
                    ? "bg-ink text-ivory ring-ink"
                    : "bg-card text-ink-2 ring-black/5"
                }`}
              >
                {s === "todos" ? "Todos" : CLIENT_STATUS[s]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="label-caps">A carregar…</p>
          ) : filtered.length === 0 ? (
            <Empty
              title={clients.length === 0 ? "Ainda sem clientes" : "Nenhum resultado"}
              hint={
                clients.length === 0
                  ? "Guarde a primeira pessoa com quem está a conversar."
                  : "Tente outro nome ou estado."
              }
            />
          ) : (
            <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
              {filtered.map((c) => (
                <ClientRow key={c.id} client={c} onEdit={() => setEditing(c)} />
              ))}
            </ul>
          )}
        </>
      )}

      <Link to="/diagnostico" className="block text-center text-xs text-gold font-medium pt-1">
        Ir para diagnóstico de trabalho →
      </Link>
    </AppShell>
  );
}
