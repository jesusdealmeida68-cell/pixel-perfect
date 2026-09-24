import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Table2 } from "lucide-react";
import { AppShell, PageHeader, Empty } from "@/components/AppShell";
import { Field, TextInput, PrimaryButton, GhostButton } from "@/components/Field";
import { useTables, useCreateTable } from "@/hooks/useData";
import type { TableColumn } from "@/hooks/useData";
import { formatDate } from "@/lib/bdo";

export const Route = createFileRoute("/tabelas")({
  head: () => ({
    meta: [
      { title: "Tabelas — Gestão Fácil" },
      {
        name: "description",
        content: "Crie tabelas simples para vendas, despesas ou stock, sem complicação.",
      },
    ],
  }),
  component: TabelasPage,
});

const col = (name: string, type: TableColumn["type"]): TableColumn => ({
  id: name.toLowerCase().replace(/\s+/g, "_"),
  name,
  type,
});

const TEMPLATES: { key: string; label: string; hint: string; columns: TableColumn[] }[] = [
  {
    key: "vendas",
    label: "Controlo de vendas",
    hint: "Data, cliente, produto, valor",
    columns: [
      col("Data", "data"),
      col("Cliente", "texto"),
      col("Produto", "texto"),
      col("Valor", "moeda"),
    ],
  },
  {
    key: "despesas",
    label: "Despesas do mês",
    hint: "Data, descrição, categoria, valor",
    columns: [
      col("Data", "data"),
      col("Descrição", "texto"),
      col("Categoria", "texto"),
      col("Valor", "moeda"),
    ],
  },
  {
    key: "stock",
    label: "Controlo de stock",
    hint: "Produto, quantidade, preço unitário",
    columns: [col("Produto", "texto"), col("Quantidade", "numero"), col("Preço unitário", "moeda")],
  },
  {
    key: "vazia",
    label: "Tabela em branco",
    hint: "Comece do zero e adicione colunas",
    columns: [col("Coluna 1", "texto")],
  },
];

function TabelasPage() {
  const { data: tables = [], isLoading } = useTables();
  const create = useCreateTable();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0]!.key);
  const [saving, setSaving] = useState(false);
  const navigateTo = (id: string) => (window.location.href = `/tabelas/${id}`);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Dê um nome à tabela.");
      return;
    }
    setSaving(true);
    try {
      const tpl = TEMPLATES.find((t) => t.key === template) ?? TEMPLATES[0]!;
      const table = await create.mutateAsync({ title, columns: tpl.columns, rows: [] });
      toast.success("Tabela criada.");
      setOpen(false);
      setTitle("");
      navigateTo(table.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível criar a tabela.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={`${tables.length} tabelas`}
        title="Tabelas"
        action={
          !open ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 bg-ink text-ivory rounded-md py-2 px-3 text-sm font-medium ring-1 ring-black/5 shrink-0"
            >
              <Plus className="size-4" /> Nova
            </button>
          ) : undefined
        }
      />

      {open ? (
        <div className="rounded-lg ring-1 ring-black/5 bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Nova tabela</h2>
            <button onClick={() => setOpen(false)} className="text-ink-3">
              <X className="size-5" />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Nome da tabela">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Vendas de setembro"
                autoFocus
              />
            </Field>
            <div>
              <span className="label-caps">Modelo</span>
              <div className="mt-1.5 grid grid-cols-1 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setTemplate(t.key)}
                    className={`text-left rounded-md border px-3 py-2.5 ${
                      template === t.key
                        ? "border-gold ring-2 ring-gold/30 bg-gold/5"
                        : "border-line bg-card"
                    }`}
                  >
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-ink-3">{t.hint}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <PrimaryButton type="submit" disabled={saving} className="flex-1">
                {saving ? "A criar…" : "Criar tabela"}
              </PrimaryButton>
              <GhostButton type="button" onClick={() => setOpen(false)}>
                Cancelar
              </GhostButton>
            </div>
          </form>
        </div>
      ) : isLoading ? (
        <p className="label-caps">A carregar…</p>
      ) : tables.length === 0 ? (
        <Empty title="Ainda sem tabelas" hint="Crie a sua primeira tabela a partir de um modelo." />
      ) : (
        <ul className="bg-card ring-1 ring-black/5 rounded-lg divide-y divide-line">
          {tables.map((t) => (
            <li key={t.id}>
              <Link to="/tabelas/$id" params={{ id: t.id }} className="p-3 flex items-center gap-3">
                <span className="grid place-items-center size-9 rounded-md bg-gold/10 text-gold shrink-0">
                  <Table2 className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-ink-3">
                    {t.rows.length} linhas · {t.columns.length} colunas · {formatDate(t.updated_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
