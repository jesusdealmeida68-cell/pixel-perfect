import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Download } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { TextInput } from "@/components/Field";
import { useTable, useUpdateTable, useDeleteTable, useCompany } from "@/hooks/useData";
import type { TableColumn, TableRow } from "@/hooks/useData";
import { formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/tabelas/$id")({
  head: () => ({ meta: [{ title: "Tabela — Gestão Fácil" }] }),
  component: TabelaEditor,
});

function newRow(columns: TableColumn[]): TableRow {
  const row: TableRow = {};
  for (const c of columns) row[c.id] = "";
  return row;
}

function calcTotal(rows: TableRow[], col: TableColumn) {
  if (col.type !== "numero" && col.type !== "moeda") return null;
  return rows.reduce((s, r) => s + (Number(r[col.id]) || 0), 0);
}

function TabelaEditor() {
  const { id } = Route.useParams();
  const { data: table, isLoading } = useTable(id);
  const { data: company } = useCompany();
  const update = useUpdateTable();
  const remove = useDeleteTable();
  const currency = company?.currency ?? "EUR";

  const [title, setTitle] = useState("");
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (table && !dirty) {
      setTitle(table.title);
      setColumns(table.columns);
      setRows(table.rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  async function save(next?: { title?: string; columns?: TableColumn[]; rows?: TableRow[] }) {
    const payload = {
      id,
      title: next?.title ?? title,
      columns: next?.columns ?? columns,
      rows: next?.rows ?? rows,
    };
    try {
      await update.mutateAsync(payload);
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.");
    }
  }

  function addRow() {
    const next = [...rows, newRow(columns)];
    setRows(next);
    save({ rows: next });
  }

  function removeRow(idx: number) {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    save({ rows: next });
  }

  function setCell(idx: number, colId: string, value: string) {
    const next = rows.map((r, i) => (i === idx ? { ...r, [colId]: value } : r));
    setRows(next);
    setDirty(true);
  }

  function addColumn() {
    const name = prompt("Nome da nova coluna:");
    if (!name?.trim()) return;
    const newCol: TableColumn = {
      id: `${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`,
      name,
      type: "texto",
    };
    const next = [...columns, newCol];
    setColumns(next);
    save({ columns: next });
  }

  function removeColumn(colId: string) {
    if (!confirm("Remover esta coluna?")) return;
    const nextCols = columns.filter((c) => c.id !== colId);
    const nextRows = rows.map((r) => {
      const { [colId]: _omit, ...rest } = r;
      return rest;
    });
    setColumns(nextCols);
    setRows(nextRows);
    save({ columns: nextCols, rows: nextRows });
  }

  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const data = rows.map((r) => {
      const o: Record<string, string | number> = {};
      for (const c of columns) o[c.name] = r[c.id] ?? "";
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 30) || "Tabela");
    XLSX.writeFile(wb, `${(title || "tabela").replace(/[^a-z0-9]+/gi, "-")}.xlsx`);
  }

  if (isLoading) {
    return (
      <AppShell>
        <p className="label-caps">A carregar…</p>
      </AppShell>
    );
  }
  if (!table) {
    return (
      <AppShell>
        <div className="rounded-lg ring-1 ring-black/5 bg-card p-8 text-center">
          <p className="font-display text-base font-bold">Tabela não encontrada</p>
          <Link to="/tabelas" className="text-xs text-gold font-medium mt-2 inline-block">
            Voltar às tabelas
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/tabelas"
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 shrink-0"
        >
          <ArrowLeft className="size-4" /> Tabelas
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={exportXlsx}
            className="inline-flex items-center gap-1.5 border border-line bg-card rounded-md py-2 px-3 text-sm font-medium"
          >
            <Download className="size-4" /> Excel
          </button>
          <button
            onClick={async () => {
              if (!confirm("Apagar esta tabela?")) return;
              await remove.mutateAsync(id);
              toast.success("Tabela apagada.");
              window.location.href = "/tabelas";
            }}
            className="text-destructive"
          >
            <Trash2 className="size-4.5" />
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setDirty(true);
        }}
        onBlur={() => save()}
        className="font-display text-2xl font-bold bg-transparent outline-none w-full"
      />

      <div className="rounded-lg ring-1 ring-black/5 bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th key={c.id} className="text-left p-2.5 font-medium text-ink-2">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate">{c.name}</span>
                    <button onClick={() => removeColumn(c.id)} className="text-ink-3 shrink-0">
                      <X className="size-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-2.5 w-10">
                <button onClick={addColumn} className="text-gold">
                  <Plus className="size-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-b border-line last:border-0">
                {columns.map((c) => (
                  <td key={c.id} className="p-1.5">
                    <input
                      value={String(r[c.id] ?? "")}
                      onChange={(e) => setCell(idx, c.id, e.target.value)}
                      onBlur={() => save()}
                      type={
                        c.type === "numero" || c.type === "moeda"
                          ? "number"
                          : c.type === "data"
                            ? "date"
                            : "text"
                      }
                      step={c.type === "moeda" ? "0.01" : undefined}
                      className="w-full min-w-20 rounded bg-transparent px-1.5 py-1 outline-none focus:bg-ivory-2 focus:ring-1 focus:ring-gold"
                    />
                  </td>
                ))}
                <td className="p-1.5">
                  <button onClick={() => removeRow(idx)} className="text-ink-3">
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {columns.some((c) => c.type === "numero" || c.type === "moeda") ? (
            <tfoot>
              <tr className="border-t border-line bg-ivory-2/50 font-medium">
                {columns.map((c, i) => {
                  const total = calcTotal(rows, c);
                  return (
                    <td key={c.id} className="p-2.5 font-mono tabular-nums">
                      {total === null
                        ? i === 0
                          ? "Total"
                          : ""
                        : c.type === "moeda"
                          ? formatMoney(total, currency)
                          : total}
                    </td>
                  );
                })}
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <button
        onClick={addRow}
        className="w-full inline-flex items-center justify-center gap-1.5 border border-dashed border-line rounded-md py-2.5 text-sm font-medium text-ink-2"
      >
        <Plus className="size-4" /> Adicionar linha
      </button>
    </AppShell>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
