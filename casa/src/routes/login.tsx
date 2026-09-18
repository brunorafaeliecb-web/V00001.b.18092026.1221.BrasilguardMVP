import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PlusMarks } from "@/components/plus-marks";
import { BrasilguardLockup } from "@/components/polvo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { polvoError } from "@/lib/polvo/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <span className="size-10 rounded-full bg-secondary shimmer" />
          <span className="h-8 w-32 rounded-full bg-secondary shimmer" />
          <span className="h-11 w-full rounded-full bg-secondary shimmer" />
          <span className="h-11 w-full rounded-full bg-secondary shimmer" />
        </div>
      </main>
    );
  }

  if (user) return <Navigate to="/" />;

  async function onOauth(providerId: string) {
    setError(null);
    setBusy(true);
    try {
      await signIn(providerId, { callbackURL: "/", errorCallbackURL: "/login" });
    } catch (err) {
      setError(polvoError(err));
      setBusy(false);
    }
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "Operador",
          callbackURL: "/",
        });
        if (err) throw new Error(err.message ?? "Não deu para criar a conta.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (err) throw new Error(err.message ?? "E-mail ou senha não conferem.");
      }
      await authClient.getSession();
    } catch (err) {
      setError(polvoError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center bg-background px-6 py-16">
      <div className="relative w-full max-w-md p-2 md:p-6">
        <PlusMarks />
        <div className="flex flex-col items-start gap-8">
          <BrasilguardLockup className="text-xl md:text-2xl" />
          <div>
            <p className="kicker text-muted">Aliança Saúde</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Entre na caixa.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              CRM de WhatsApp da Aliança Saúde. O primeiro a entrar vira administrador. Convite
              entra no papel combinado.
            </p>
          </div>

          {authEnabled ? (
            <div className="flex w-full flex-col gap-3">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={busy}
                  onClick={() => void onOauth(p.providerId)}
                  className="w-full"
                >
                  Continuar com {p.label}
                </Button>
              ))}

              <div className="my-2 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="kicker text-subtle">e-mail</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "h-11 flex-1 rounded-full text-xs font-medium tracking-widest uppercase pressable",
                    mode === "in" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
                  )}
                  onClick={() => setMode("in")}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  className={cn(
                    "h-11 flex-1 rounded-full text-xs font-medium tracking-widest uppercase pressable",
                    mode === "up" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
                  )}
                  onClick={() => setMode("up")}
                >
                  Criar conta
                </button>
              </div>

              <form className="flex flex-col gap-3" onSubmit={(e) => void onEmail(e)}>
                {mode === "up" ? (
                  <Input
                    name="name"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                ) : null}
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="karen.d@example.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  name="password"
                  type="password"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  placeholder="Senha · 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button type="submit" size="lg" disabled={busy} className="w-full">
                  {busy ? "Aguarde…" : mode === "up" ? "Criar e entrar" : "Entrar"}
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted">Entrar está desligado neste ambiente.</p>
          )}
        </div>
      </div>
    </main>
  );
}
