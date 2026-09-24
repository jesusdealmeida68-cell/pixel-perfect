import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader, Chip } from "@/components/AppShell";
import { Field, TextInput, Select, PrimaryButton, GhostButton, Panel } from "@/components/Field";
import { useClients, useCompany, useCreateDocument, useLogActivity } from "@/hooks/useData";
import { formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico — Gestão Fácil" },
      {
        name: "description",
        content: "Analise o custo e o lucro de um trabalho antes de aceitar.",
      },
    ],
  }),
  component: DiagnosticoPage,
});

function num(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function DiagnosticoPage() {
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();
  const { data: company } = useCompany();
  const createDocument = useCreateDocument();
  const logActivity = useLogActivity();
  const currency = company?.currency ?? "EUR";

  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState("");
  const [clientOffer, setClientOffer] = useState("");
  const [materiais, setMateriais] = useState("");
  const [transporte, setTransporte] = useState("");
  const [taxas, setTaxas] = useState("");
  const [tempo, setTempo] = useState("");
  const [outros, setOutros] = useState("");
  const [margem, setMargem] = useState("30");
  const [saving, setSaving] = useState(false);

  const costItems = useMemo(
    () =>
      [
        { description: "Materiais", amount: num(materiais) },
        { description: "Transporte", amount: num(transporte) },
        { description: "Taxas", amount: num(taxas) },
        { description: "Tempo / mão-de-obra", amount: num(tempo) },
        { description: "Outros gastos", amount: num(outros) },
      ].filter((i) => i.amount > 0),
    [materiais, transporte, taxas, tempo, outros],
  );

  const custoTotal = costItems.reduce((s, i) => s + i.amount, 0);
  const margemPct = Math.min(Math.max(num(margem), 0), 95) / 100;
  const precoRecomendado = margemPct < 1 ? custoTotal / (1 - margemPct) : custoTotal;
  const oferta = num(clientOffer);
  const lucroRecomendado = precoRecomendado - custoTotal;
  const lucroOferta = oferta - custoTotal;
  const margemOferta = oferta > 0 ? (lucroOferta / oferta) * 100 : 0;

  const resultado =
    custoTotal === 0
      ? null
      : oferta <= 0
        ? { tom: "ink" as const, texto: "Indique o valor que o cliente pretende pagar para comparar." }
        : oferta < custoTotal
          ? { tom: "muted" as const, texto: "Recusar — o valor oferecido não cobre os custos." }
          : oferta < precoRecomendado
            ? { tom: "ink" as const, texto: "Negociar — dá lucro, mas abaixo do preço recomendado." }
            : { tom: "gold" as const, texto: "Aceitar — o valor cobre os custos e a margem desejada." };

  async function guardar(gerarProposta: boolean) {
    if (!service.trim()) {
      toast.error("Indique o serviço ou produto.");
      return;
    }
    if (custoTotal <= 0) {
      toast.error("Indique pelo menos um custo para calcular o diagnóstico.");
      return;
    }
    setSaving(true);
    try {
      const diagnosisText = resultado?.texto ?? "";
      const doc = await createDocument.mutateAsync({
        kind: gerarProposta ? "proposta" : "diagnostico",
        client_id: clientId || null,
        title: `${gerarProposta ? "Proposta" : "Diagnóstico"} — ${service}`,
        service,
        diagnosis: [
          `Custo total: ${formatMoney(custoTotal, currency)}`,
          `Preço recomendado: ${formatMoney(precoRecomendado, currency)}`,
          `Lucro estimado: ${formatMoney(lucroRecomendado, currency)}`,
          `Margem: ${(margemPct * 100).toFixed(0)}%`,
          diagnosisText,
        ].join(" · "),
        items: costItems,
        base_price: gerarProposta ? (oferta > 0 ? oferta : precoRecomendado) : precoRecomendado,
        total: gerarProposta ? (oferta > 0 ? oferta : precoRecomendado) : precoRecomendado,
        notes: clientName && !clientId ? `Cliente: ${clientName}` : null,
      });
      await logActivity.mutateAsync({
        message: `${gerarProposta ? "Proposta criada" : "Diagnóstico feito"}: ${service}`,
        kind: "documento",
        client_id: clientId || null,
        amount: precoRecomendado,
      });
      toast.success(gerarProposta ? "Proposta criada." : "Diagnóstico guardado.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Antes de aceitar" title="Diagnóstico do trabalho" />

      <Panel title="Dados do trabalho">
        <div className="space-y-3">
          {clients.length > 0 ? (
            <Field label="Cliente (opcional)">
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— Sem cliente guardado —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          {!clientId ? (
            <Field label="Nome do cliente (opcional)">
              <TextInput
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex.: Maria Fernandes"
              />
            </Field>
          ) : null}
          <Field label="Serviço / produto">
            <TextInput
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Ex.: Desenvolvimento de logótipo"
            />
          </Field>
          <Field label={`Valor que o cliente pretende pagar (${currency})`}>
            <TextInput
              inputMode="decimal"
              value={clientOffer}
              onChange={(e) => setClientOffer(e.target.value)}
              placeholder="0,00"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Custos">
        <div className="grid grid-cols-2 gap-3">
          <Field label={`Materiais (${currency})`}>
            <TextInput inputMode="decimal" value={materiais} onChange={(e) => setMateriais(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label={`Transporte (${currency})`}>
            <TextInput inputMode="decimal" value={transporte} onChange={(e) => setTransporte(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label={`Taxas (${currency})`}>
            <TextInput inputMode="decimal" value={taxas} onChange={(e) => setTaxas(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label={`Tempo / mão-de-obra (${currency})`}>
            <TextInput inputMode="decimal" value={tempo} onChange={(e) => setTempo(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label={`Outros gastos (${currency})`} className="col-span-2">
            <TextInput inputMode="decimal" value={outros} onChange={(e) => setOutros(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Margem de lucro desejada (%)" className="col-span-2">
            <TextInput inputMode="decimal" value={margem} onChange={(e) => setMargem(e.target.value)} placeholder="30" />
          </Field>
        </div>
      </Panel>

      <Panel title="Resultado do diagnóstico">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
            <p className="text-xs text-ink-3">Custo total</p>
            <p className="font-mono text-xl font-semibold tabular-nums mt-1">
              {formatMoney(custoTotal, currency)}
            </p>
          </div>
          <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
            <p className="text-xs text-ink-3">Preço recomendado</p>
            <p className="font-mono text-xl font-semibold text-gold tabular-nums mt-1">
              {formatMoney(precoRecomendado, currency)}
            </p>
          </div>
          <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
            <p className="text-xs text-ink-3">Lucro estimado</p>
            <p className="font-mono text-xl font-semibold tabular-nums mt-1">
              {formatMoney(oferta > 0 ? lucroOferta : lucroRecomendado, currency)}
            </p>
          </div>
          <div className="bg-ivory-2/70 ring-1 ring-black/5 rounded-lg p-4">
            <p className="text-xs text-ink-3">Margem</p>
            <p className="font-mono text-xl font-semibold tabular-nums mt-1">
              {oferta > 0 ? `${margemOferta.toFixed(0)}%` : `${(margemPct * 100).toFixed(0)}%`}
            </p>
          </div>
        </div>
        {resultado ? (
          <div className="mt-3 flex items-center gap-2">
            <Chip label={resultado.tom === "gold" ? "Aceitar" : resultado.tom === "muted" ? "Recusar" : "Negociar"} tone={resultado.tom} />
            <p className="text-sm text-ink-2">{resultado.texto}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-3 mt-3">Preencha os custos para ver o resultado.</p>
        )}

        <div className="flex flex-wrap gap-2 mt-5">
          <PrimaryButton onClick={() => guardar(false)} disabled={saving}>
            {saving ? "A guardar…" : "Guardar diagnóstico"}
          </PrimaryButton>
          <GhostButton onClick={() => guardar(true)} disabled={saving}>
            Gerar proposta
          </GhostButton>
        </div>
      </Panel>
    </AppShell>
  );
}
