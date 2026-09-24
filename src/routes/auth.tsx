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
      { title: "Entrar — Gestão Fácil" },
      { name: "description", content: "Aceda à sua conta Gestão Fácil." },
      { property: "og:title", content: "Entrar — Gestão Fácil" },
      { property: "og:description", content: "Aceda à sua conta Gestão Fácil." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [phoneStep, setPhoneStep] = useState<"phone" | "code">("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [emailMode, setEmailMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Indique o seu número de telefone.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp(
        name
          ? { phone: phone.trim(), options: { data: { full_name: name } } }
          : { phone: phone.trim() },
      );
      if (error) throw error;
      toast.success("Código enviado por SMS.");
      setPhoneStep("code");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar o código. Tente com e-mail em baixo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Indique o código recebido.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (emailMode === "up") {
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
          {phoneStep === "phone" ? "Criar a sua conta" : "Confirme o código"}
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          {phoneStep === "phone"
            ? "Entre rapidamente com o seu número de telefone."
            : `Enviámos um código por SMS para ${phone}.`}
        </p>

        {!showEmail ? (
          phoneStep === "phone" ? (
            <form onSubmit={sendCode} className="mt-5 space-y-3">
              <div>
                <label className="label-caps" htmlFor="name">
                  Nome
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O seu nome"
                  className="mt-1 w-full rounded-md bg-card ring-1 ring-black/5 border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div>
                <label className="label-caps" htmlFor="phone">
                  Número de telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 900 000 000"
                  className="mt-1 w-full rounded-md bg-card ring-1 ring-black/5 border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-ink text-ivory py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {busy ? "A enviar…" : "Enviar código"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-5 space-y-3">
              <div>
                <label className="label-caps" htmlFor="code">
                  Código de verificação
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="mt-1 w-full rounded-md bg-card ring-1 ring-black/5 border border-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold tracking-[0.3em] font-mono text-center"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-ink text-ivory py-2.5 text-sm font-medium disabled:opacity-60"
              >
                {busy ? "A confirmar…" : "Confirmar e entrar"}
              </button>
              <button
                type="button"
                onClick={() => setPhoneStep("phone")}
                className="w-full text-center text-xs text-ink-3"
              >
                Corrigir número
              </button>
            </form>
          )
        ) : (
          <form onSubmit={submitEmail} className="mt-5 space-y-3">
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
              {busy ? "Aguarde…" : emailMode === "in" ? "Entrar" : "Criar conta"}
            </button>
            <p className="text-sm text-ink-3 text-center">
              {emailMode === "in" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setEmailMode(emailMode === "in" ? "up" : "in")}
                className="text-gold font-medium"
              >
                {emailMode === "in" ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </form>
        )}

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="label-caps">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="space-y-2">
          <button
            onClick={google}
            className="w-full rounded-md border border-line bg-card py-2.5 text-sm font-medium"
          >
            Continuar com a Google
          </button>
          <button
            onClick={() => setShowEmail((v) => !v)}
            className="w-full text-center text-xs text-ink-3 underline underline-offset-2"
          >
            {showEmail ? "Usar número de telefone" : "Prefiro usar e-mail e palavra-passe"}
          </button>
        </div>
      </div>
    </div>
  );
}
