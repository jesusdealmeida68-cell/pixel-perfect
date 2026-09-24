import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useClients, useJobs, useDocuments, useCompany } from "@/hooks/useData";
import { formatMoney } from "@/lib/bdo";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente — Gestão Fácil" },
      { name: "description", content: "Pergunte sobre os seus clientes, trabalhos e finanças." },
    ],
  }),
  component: AssistentePage,
});

type Msg = { from: "user" | "bot"; text: string; link?: { to: string; label: string } };

const SUGESTOES = [
  "Quanto lucrei este mês?",
  "Mostra os clientes que ainda não fecharam",
  "Quais trabalhos estão em andamento?",
  "Cria uma tabela para vendas",
];

function AssistentePage() {
  const { data: clients = [] } = useClients();
  const { data: jobs = [] } = useJobs();
  const { data: documents = [] } = useDocuments();
  const { data: company } = useCompany();
  const currency = company?.currency ?? "EUR";
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "Olá! Pergunte-me sobre os seus clientes, trabalhos, documentos ou finanças — respondo com base nos dados desta conta.",
    },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const context = useMemo(() => ({ clients, jobs, documents }), [clients, jobs, documents]);

  function answer(question: string): Msg {
    const q = question.toLowerCase();

    if (q.includes("lucr") || q.includes("recebi") || q.includes("ganhei")) {
      const recebido = jobs
        .filter((j) => j.status !== "cancelado")
        .reduce((s, j) => s + Number(j.paid_amount || 0), 0);
      const pendente = jobs
        .filter((j) => j.status !== "cancelado")
        .reduce((s, j) => s + Math.max(Number(j.amount) - Number(j.paid_amount), 0), 0);
      return {
        from: "bot",
        text: `Já recebeu ${formatMoney(recebido, currency)}. Ainda há ${formatMoney(pendente, currency)} pendente de pagamento.`,
        link: { to: "/financas", label: "Ver finanças completas" },
      };
    }

    if (
      q.includes("cliente") &&
      (q.includes("não fech") || q.includes("aberto") || q.includes("negocia"))
    ) {
      const abertos = context.clients.filter(
        (c) => c.status === "negociacao" || c.status === "sem_contrato",
      );
      if (abertos.length === 0)
        return { from: "bot", text: "Não há clientes em aberto neste momento. 🎉" };
      const nomes = abertos
        .slice(0, 6)
        .map((c) => c.full_name)
        .join(", ");
      return {
        from: "bot",
        text: `Tem ${abertos.length} cliente(s) por fechar: ${nomes}${abertos.length > 6 ? "…" : ""}.`,
        link: { to: "/clientes", label: "Ver clientes" },
      };
    }

    if (
      q.includes("trabalho") &&
      (q.includes("andamento") || q.includes("ativo") || q.includes("curso"))
    ) {
      const ativos = context.jobs.filter((j) => j.status === "andamento");
      if (ativos.length === 0)
        return { from: "bot", text: "Não há trabalhos em andamento neste momento." };
      const nomes = ativos
        .slice(0, 6)
        .map((j) => j.title)
        .join(", ");
      return {
        from: "bot",
        text: `${ativos.length} trabalho(s) em andamento: ${nomes}${ativos.length > 6 ? "…" : ""}.`,
        link: { to: "/trabalhos", label: "Ver trabalhos" },
      };
    }

    if (q.includes("tabela") || q.includes("planilha") || q.includes("excel")) {
      return {
        from: "bot",
        text: "Posso criar uma tabela para si — escolha um modelo (vendas, despesas, stock ou em branco) e eu preencho as colunas automaticamente.",
        link: { to: "/tabelas", label: "Criar tabela" },
      };
    }

    if (q.includes("proposta") || q.includes("orçamento") || q.includes("documento")) {
      return {
        from: "bot",
        text: `Tem ${context.documents.length} documento(s) guardados (diagnósticos, propostas, orçamentos).`,
        link: { to: "/documentos", label: "Ver documentos" },
      };
    }

    if (q.includes("cliente")) {
      return {
        from: "bot",
        text: `Tem ${context.clients.length} cliente(s) guardados.`,
        link: { to: "/clientes", label: "Ver clientes" },
      };
    }

    return {
      from: "bot",
      text: "Ainda estou a aprender essa pergunta. Pode tentar sobre lucro, clientes por fechar, trabalhos em andamento, documentos ou criar uma tabela.",
    };
  }

  function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question) return;
    const botMsg = answer(question);
    setMessages((m) => [...m, { from: "user", text: question }, botMsg]);
    setInput("");
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Pergunte aos seus dados" title="Assistente" />

      <div
        ref={scrollRef}
        className="rounded-lg ring-1 ring-black/5 bg-card p-4 h-[52vh] overflow-y-auto space-y-3"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.from === "user" ? "bg-ink text-ivory" : "bg-ivory-2 text-ink"
              }`}
            >
              {m.from === "bot" ? (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-gold font-medium mb-1">
                  <Sparkles className="size-3" /> Assistente
                </span>
              ) : null}
              <p className="leading-relaxed">{m.text}</p>
              {m.link ? (
                <Link
                  to={m.link.to}
                  className="inline-block mt-1.5 text-xs font-medium text-gold underline underline-offset-2"
                >
                  {m.link.label}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SUGESTOES.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-black/5 bg-card text-ink-2"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva a sua pergunta…"
          className="flex-1 rounded-md bg-card border border-line px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          className="grid place-items-center size-10 rounded-md bg-ink text-ivory shrink-0"
        >
          <Send className="size-4" />
        </button>
      </form>
    </AppShell>
  );
}
