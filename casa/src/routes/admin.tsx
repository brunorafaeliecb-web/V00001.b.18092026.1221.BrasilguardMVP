import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PlusMarks } from "@/components/plus-marks";
import { BrasilguardLockup } from "@/components/polvo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canAdmin,
  CHANNEL_ORDER,
  CHANNELS,
  ROLE_BLURB,
  ROLE_LABEL,
  TENTACLES,
} from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import { listChannels, updateOrg } from "@/lib/polvo/server";
import { usePolvoSession } from "@/lib/polvo/session";
import type { ChannelAccount, Role } from "@/lib/polvo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { session, isPending, refresh } = usePolvoSession();
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [busy, setBusy] = useState(false);

  const actor = session?.member;
  const isAdm = actor ? canAdmin(actor.role) : false;

  useEffect(() => {
    if (session) setName(session.org.name);
  }, [session]);

  useEffect(() => {
    listChannels()
      .then(setChannels)
      .catch(() => setChannels([]));
  }, []);

  if (isPending) return <div className="h-40 rounded-2xl bg-secondary shimmer" />;

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!isAdm) return;
    setBusy(true);
    try {
      const next = await updateOrg({ data: { name } });
      setName(next.name);
      toast.success("Casa atualizada.");
      await refresh();
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(false);
    }
  }

  const byId = new Map(channels.map((c) => [c.channel, c]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
      <header className="relative px-2 py-6 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">Administração</p>
        <h1 className="text-display mt-4">
          <span className="word-stagger">
            <span>Admin.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          {isAdm
            ? "Nome da casa, papéis, linhas e canais. O que o supervisor não toca."
            : "Leitura. Só o administrador altera a casa."}
        </p>
      </header>

      <form
        onSubmit={(e) => void onSave(e)}
        className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]"
      >
        <label className="kicker text-muted" htmlFor="org-name">
          Nome da organização
        </label>
        <Input
          id="org-name"
          className="mt-2"
          value={name}
          disabled={!isAdm}
          onChange={(e) => setName(e.target.value)}
        />
        {isAdm ? (
          <Button type="submit" className="mt-4" disabled={busy}>
            {busy ? "Salvando…" : "Salvar"}
          </Button>
        ) : null}
      </form>

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Papéis</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(["operator", "supervisor", "admin"] as Role[]).map((r) => (
            <article key={r} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
              <p className="kicker text-muted">{ROLE_LABEL[r]}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{ROLE_BLURB[r]}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Linhas</h2>
          <Link to="/brasilguard" className="kicker text-muted hover:text-foreground">
            Abrir
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {TENTACLES.map((t) => (
            <article key={t.id} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
              <p className="kicker text-subtle">{t.kicker}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                {t.id === "brasilguard" ? <BrasilguardLockup className="text-xl" /> : t.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t.blurb}</p>
              <p className={cn("mt-4 kicker", t.live ? "text-klein" : "text-subtle")}>
                {t.live ? "ao vivo" : "em acoplamento"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Canais</h2>
          <Link to="/canais" className="kicker text-muted hover:text-foreground">
            Abrir
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {CHANNEL_ORDER.map((id) => {
            const meta = CHANNELS[id];
            const acc = byId.get(id);
            return (
              <article
                key={id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-5 py-4 shadow-[var(--shadow-border)]"
              >
                <div>
                  <p className="font-medium">{meta.name}</p>
                  <p className="mt-1 text-sm text-muted">{acc?.label ?? meta.blurb}</p>
                </div>
                <span className={cn("kicker", meta.live ? "text-klein" : "text-subtle")}>
                  {meta.live ? "demo" : "desconectado"}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
