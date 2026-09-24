import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "@/components/AppShell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Bellucci d'Oro" },
      { name: "description", content: "Aceda à sua conta Bellucci d'Oro." },
      { property: "og:title", content: "Entrar — Bellucci d'Oro" },
      { property: "og:description", content: "Aceda à sua conta Bellucci d'Oro." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada. Verifique o seu e-mail para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com a Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-ivory text-ink grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Brand size="lg" />
        <p className="text-xs uppercase tracking-[0.18em] text-gold font-medium mt-6">
          Acesso reservado
        </p>
        <h1 className="font-display text-2xl font-bold mt-1">
          {mode === "in" ? "Entrar na plataforma" : "Criar a sua conta"}
        </h1>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="label-caps" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md bg-card ring-1 ring-black/5 border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="label-caps" htmlFor="password">
              Palavra-passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md bg-card ring-1 ring-black/5 border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-ink text-ivory py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {busy ? "Aguarde…" : mode === "in" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="label-caps">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          onClick={google}
          className="w-full rounded-md border border-line bg-card py-2.5 text-sm font-medium"
        >
          Continuar com a Google
        </button>

        <p className="text-sm text-ink-3 mt-5">
          {mode === "in" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="text-gold font-medium"
          >
            {mode === "in" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
