import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { AppShell, PageHeader, Chip, Empty } from "@/components/AppShell";
import { Field, TextInput, TextArea, Select, PrimaryButton, GhostButton } from "@/components/Field";
import {
  useJobs,
  useClients,
  useCompany,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
  useLogActivity,
} from "@/hooks/useData";
import type { Job } from "@/hooks/useData";
import { JOB_STATUS, formatDate, formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/trabalhos")({
  head: () => ({
    meta: [
      { title: "Trabalhos — Gestão Fácil" },
      {
        name: "description",
        content: "Acompanhe os trabalhos em negociação, andamento e concluídos.",
      },
    ],
  }),
  component: TrabalhosPage,
});

const STATUS_ORDER = [
  "negociacao",
  "aguardando_pagamento",
  "andamento",
  "concluido",
  "cancelado",
] as const;

function tone(status: string) {
  if (status === "concluido") return "gold" as const;
  if (status === "cancelado") return "muted" as const;
  return "ink" as const;
}

function emptyForm() {
  return {
    client_id: "",
    title: "",
    service: "",
    description: "",
    due_date: "",
    amount: "",
    paid_amount: "",
    status: "negociacao",
  };
}

function JobForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Job | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { data: clients = [] } = useClients();
  const [form, setForm] = useState(() =>
    initial
      ? {
          client_id: initial.client_id ?? "",
          title: initial.title,
          service: initial.service ?? "",
          description: initial.description ?? "",
          due_date: initial.due_date ?? "",
          amount: String(initial.amount ?? ""),
          paid_amount: String(initial.paid_amount ?? ""),
          status: initial.status,
        }
      : emptyForm(),
  );
  const [saving, setSaving] = useState(false);
  const create = useCreateJob();
  const update = useUpdateJob();
  const logActivity = useLogActivity();

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Indique um título para o trabalho.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        client_id: form.client_id || null,
        due_date: form.due_date || null,
        amount: Number(form.amount.replace(",", ".")) || 0,
        paid_amount: Number(form.paid_amount.replace(",", ".")) || 0,
      };
      if (initial) {
        await update.mutateAsync({ id: initial.id, ...payload });
        toast.success("Trabalho atualizado.");
      } else {
        await create.mutateAsync(payload);
        await logActivity.mutateAsync({
          message: `Novo trabalho: ${form.title}`,
          kind: "trabalho",
          client_id: form.client_id || null,
          amount: payload.amount,
        });
        toast.success("Trabalho registado.");
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
      <Field label="Título do trabalho">
        <TextInput
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Ex.: Website institucional"
          autoFocus
        />
      </Field>
      {clients.length > 0 ? (
        <Field label="Cliente (opcional)">
          <Select value={form.client_id} onChange={(e) => set("client_id", e.target.value)}>
            <option value="">— Sem cliente —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Serviço / descrição breve">
        <TextInput value={form.service} onChange={(e) => set("service", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor total">
          <TextInput
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder="0,00"
          />
        </Field>
        <Field label="Já recebido">
          <TextInput
            inputMode="decimal"
            value={form.paid_amount}
            onChange={(e) => set("paid_amount", e.target.value)}
            placeholder="0,00"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo">
          <TextInput
            type="date"
            value={form.due_date}
            onChange={(e) => set("due_date", e.target.value)}
          />
        </Field>
        <Field label="Estado">
          <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notas">
        <TextArea value={form.description} onChange={(e) => set("description", e.target.value)} />
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

function JobRow({ job, currency, onEdit }: { job: Job; currency: string; onEdit: () => void }) {
  const pending = Math.max(Number(job.amount) - Number(job.paid_amount), 0);
  return (
    <li className="p-3">
      <button onClick={onEdit} className="w-full text-left flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{job.title}</p>
          <p className="text-xs text-ink-3 truncate">
            {job.service || "—"} {job.due_date ? `· prazo ${formatDate(job.due_date)}` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-sm font-semibold tabular-nums">
            {formatMoney(job.amount, currency)}
          </p>
          {pending > 0 ? (
            <p className="text-[11px] text-ink-3 font-mono tabular-nums">
              falta {formatMoney(pending, currency)}
            </p>
          ) : null}
        </div>
      </button>
      <div className="mt-1.5">
        <Chip
          label={JOB_STATUS[job.status as keyof typeof JOB_STATUS] ?? job.status}
          tone={tone(job.status)}
        />
      </div>
    </li>
  );
}

function TrabalhosPage() {
  const { data: jobs = [], isLoading } = useJobs();
  const { data: company } = useCompany();
  const deleteJob = useDeleteJob();
  const currency = company?.currency ?? "EUR";
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  const filtered = useMemo(
    () => jobs.filter((j) => statusFilter === "todos" || j.status === statusFilter),
    [jobs, statusFilter],
  );

  const showForm = open || !!editing;

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${jobs.length} ${jobs.length === 1 ? "trabalho" : "trabalhos"}`}
        title="Trabalhos"
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
              {editing ? "Editar trabalho" : "Novo trabalho"}
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
          <JobForm
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
                if (!confirm("Remover este trabalho?")) return;
                await deleteJob.mutateAsync(editing.id);
                toast.success("Trabalho removido.");
                setEditing(null);
              }}
              className="text-xs text-ink-3 mt-4 underline underline-offset-2"
            >
              Remover trabalho
            </button>
          ) : null}
        </div>
      ) : (
        <>
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
                {s === "todos" ? "Todos" : JOB_STATUS[s]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <p className="label-caps">A carregar…</p>
          ) : filtered.length === 0 ? (
            <Empty
              title={jobs.length === 0 ? "Ainda sem trabalhos" : "Nenhum resultado"}
              hint={
                jobs.length === 0
                  ? "Registe um trabalho para começar a acompanhar valores."
                  : "Tente outro estado."
              }
            />
          ) : (
            <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
              {filtered.map((j) => (
                <JobRow key={j.id} job={j} currency={currency} onEdit={() => setEditing(j)} />
              ))}
            </ul>
          )}
        </>
      )}

      <Link to="/financas" className="block text-center text-xs text-gold font-medium pt-1">
        Ver finanças →
      </Link>
    </AppShell>
  );
}
