import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { PlusMarks } from "@/components/plus-marks";
import { BrasilguardLockup } from "@/components/polvo-mark";
import { DoorToggle, useDoor } from "@/components/door-toggle";
import { Button } from "@/components/ui/button";
import { ORIGIN_LABEL, ROLE_BLURB, ROLE_LABEL, STAGE_LABEL, TENTACLES } from "@/lib/polvo/catalog";
import { listConversations } from "@/lib/polvo/server";
import { usePolvoSession } from "@/lib/polvo/session";
import type { Conversation } from "@/lib/polvo/types";
import { RELEASE_ID } from "@/lib/rastreio/parse";
import { cn, formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { session, isPending } = usePolvoSession();
  const [convos, setConvos] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!session) return;
    listConversations({ data: {} })
      .then((rows) => setConvos(rows.slice(0, 4)))
      .catch(() => setConvos([]));
  }, [session]);

  const role = session?.member.role;
  const stats = session?.stats;
  const { door, to: doorTo } = useDoor();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 md:gap-20">
      <section className="relative px-2 py-10 md:px-5 md:py-16">
        <PlusMarks />
        <p className="kicker text-muted">{session?.org.name ?? "Aliança Saúde"}</p>
        <h1 className="text-display mt-6 max-w-5xl">
          <span className="word-stagger">
            <span>A</span>
            <span>conversa.</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d2 text-klein">
            <span>A</span>
            <span>ficha.</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d3">
            <span>O</span>
            <span>pé</span>
            <span>da</span>
            <span>meada.</span>
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted">
          CRM de WhatsApp para corretor de plano de saúde. De onde veio, quem indicou, o que falta —
          na própria conversa. A Ana pergunta o que a ficha ainda não tem.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <Button asChild size="pill">
            <Link to={doorTo}>
              {door === "crm" ? "Abrir quadro" : "Abrir mensagens"}
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="pill">
            <Link to={door === "crm" ? "/inbox" : "/crm"}>
              {door === "crm" ? "Mensagens" : "Quadro"}
            </Link>
          </Button>
          <DoorToggle />
          <Button asChild variant="ghost" size="pill">
            <Link to="/rastreio">Rastreio</Link>
          </Button>
        </div>
        <p className="mt-4 font-mono text-[11px] text-subtle">{RELEASE_ID}</p>
        {role ? (
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">{ROLE_LABEL[role]}.</span> {ROLE_BLURB[role]}
          </p>
        ) : isPending ? (
          <p className="mt-6 h-4 w-64 rounded-full bg-secondary shimmer" />
        ) : null}
      </section>

      <div className="rule-grow" />

      <section className="stagger-in grid gap-4 sm:grid-cols-3">
        <Stat label="Abertos" value={stats ? String(stats.open) : "—"} hint="conversas vivas" />
        <Stat label="Não lidas" value={stats ? String(stats.unread) : "—"} hint="mensagens na fila" />
        <Stat label="Time" value={stats ? String(stats.team) : "—"} hint="membros ativos" />
      </section>

      <section className="relative p-2 md:p-4">
        <PlusMarks />
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Linhas</h2>
          <Link to="/brasilguard" className="kicker text-muted hover:text-foreground">
            Agentes
          </Link>
        </div>
        <div className="stagger-in grid gap-4 md:grid-cols-2">
          {TENTACLES.map((t) =>
            t.live ? (
              <Link
                key={t.id}
                to="/brasilguard"
                className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)] pressable hover:shadow-[var(--shadow-border-hover)]"
              >
                <p className="kicker text-subtle">{t.kicker}</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                  <BrasilguardLockup className="text-3xl" />
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">{t.blurb}</p>
                <p className="mt-6 kicker text-klein">ao vivo</p>
              </Link>
            ) : (
              <article
                key={t.id}
                className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]"
              >
                <p className="kicker text-subtle">{t.kicker}</p>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight">{t.name}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted">{t.blurb}</p>
                <p className="mt-6 kicker text-subtle">em acoplamento</p>
              </article>
            ),
          )}
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Caixa agora</h2>
          <Link to="/inbox" className="kicker text-muted hover:text-foreground">
            Caixa completa
          </Link>
        </div>
        <div className="stagger-in grid gap-3">
          {convos.length === 0 ? (
            <p className="text-sm text-muted">A caixa ainda não carregou, ou está vazia.</p>
          ) : (
            convos.map((c) => (
              <Link
                key={c.id}
                to="/inbox/$id"
                params={{ id: c.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-5 py-4 shadow-[var(--shadow-border)] pressable"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.contactName}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{c.preview}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="kicker text-subtle">{ORIGIN_LABEL[c.origin]}</span>
                  <span className={cn("kicker", c.stage === "ganho" ? "text-klein" : "text-muted")}>
                    {STAGE_LABEL[c.stage]}
                  </span>
                  <span className="kicker text-subtle">{formatRelative(c.lastAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-card px-6 py-7 shadow-[var(--shadow-border)]">
      <p className="kicker text-muted">{label}</p>
      <p className="num-pop mt-4 text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">{value}</p>
      <p className="mt-3 text-xs leading-relaxed text-subtle">{hint}</p>
    </div>
  );
}
