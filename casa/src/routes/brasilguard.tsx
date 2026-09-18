import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PlusMarks } from "@/components/plus-marks";
import { BrasilguardLockup } from "@/components/polvo-mark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AGENTS, AGENT_ORDER, PROVIDERS, PROVIDER_ORDER } from "@/lib/quatro/catalog";
import { useQuatroStore } from "@/lib/quatro/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brasilguard")({ component: Brasilguard });

function Brasilguard() {
  const workspaceName = useQuatroStore((s) => s.workspaceName);
  const setWorkspaceName = useQuatroStore((s) => s.setWorkspaceName);
  const brief = useQuatroStore((s) => s.companyBrief);
  const setBrief = useQuatroStore((s) => s.setCompanyBrief);
  const providers = useQuatroStore((s) => s.providers);
  const bindings = useQuatroStore((s) => s.bindings);
  const tickets = useQuatroStore((s) => s.tickets);
  const campaigns = useQuatroStore((s) => s.campaigns);
  const posts = useQuatroStore((s) => s.posts);
  const openCount = tickets.filter((t) => t.status !== "resolvido").length;
  const readyPosts = posts.filter((p) => p.status === "pronto").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 md:gap-20">
      <section className="relative px-2 py-10 md:px-5 md:py-16">
        <PlusMarks />
        <p className="kicker text-muted">{workspaceName}</p>
        <h1 className="text-display mt-6 max-w-5xl">
          <span className="word-stagger">
            <span>Cinco</span>
            <span>agentes.</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d2 text-klein">
            <span>Três</span>
            <span>IAs.</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d3">
            <span>Um</span>
            <span>hub.</span>
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-muted">
          <BrasilguardLockup className="mr-1 inline text-base" /> é o CRM comercial da Aliança Saúde.
          SuperGrok, Gemini Pro e ChatGPT Plus pelo que você já paga na web. Quando o MVP faturar,
          cole a chave e vire para API — sem reescrever os agentes.
        </p>
        <div className="mt-10 flex flex-wrap gap-2">
          <Button asChild size="pill">
            <Link to="/sala">
              Abrir sala
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="pill">
            <Link to="/provedores">Acoplar IAs</Link>
          </Button>
          <Button asChild variant="ghost" size="pill">
            <Link to="/inbox">Caixa WhatsApp</Link>
          </Button>
          <BriefingDialog
            name={workspaceName}
            brief={brief}
            onName={setWorkspaceName}
            onBrief={setBrief}
          />
        </div>
      </section>

      <div className="rule-grow" />

      <section className="relative p-2 md:p-4">
        <PlusMarks />
        <div className="stagger-in grid gap-4 sm:grid-cols-2">
          {AGENT_ORDER.map((id, i) => {
            const agent = AGENTS[id];
            const pid = bindings[id];
            const p = providers[pid];
            const n = String(i + 1).padStart(2, "0");
            return (
              <Link
                key={id}
                to="/agente/$id"
                params={{ id }}
                className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)] pressable hover:shadow-[var(--shadow-border-hover)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="kicker text-subtle">{n}</p>
                  <span
                    className="mt-1 size-2 rounded-full"
                    style={{ background: agent.color }}
                    aria-hidden
                  />
                </div>
                <p className="kicker mt-6 text-muted">{agent.role}</p>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight">{agent.name}</h2>
                <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">{agent.blurb}</p>
                <p className="mt-6 font-mono text-xs tracking-widest text-subtle uppercase">
                  {PROVIDERS[pid].short} · {p.coupled ? (p.mode === "api" ? "API" : "Ponte Web") : "desacoplado"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="stagger-in grid gap-4 sm:grid-cols-3">
        <Stat label="Fila de atendimento" value={String(openCount)} hint="tickets abertos" />
        <Stat
          label="Campanhas"
          value={String(campaigns.length)}
          hint={`${campaigns.filter((c) => c.status === "pronta").length} prontas`}
        />
        <Stat label="Grade da semana" value={`${readyPosts}/${posts.length}`} hint="peças fechadas" />
      </section>

      <section className="relative px-2 py-6 md:px-4">
        <PlusMarks />
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">IAs no hub</h2>
          <Link to="/provedores" className="kicker text-muted hover:text-foreground">
            Gerenciar
          </Link>
        </div>
        <div className="stagger-in grid gap-4 md:grid-cols-3">
          {PROVIDER_ORDER.map((id) => {
            const meta = PROVIDERS[id];
            const p = providers[id];
            return (
              <article key={id} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold tracking-tight">{meta.name}</h3>
                  <span className={cn("kicker", p.coupled ? "text-klein" : "text-destructive")}>
                    {p.coupled ? "acoplada" : "solta"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{meta.plan}</p>
                <p className="mt-5 font-mono text-xs tracking-widest text-subtle uppercase">
                  {p.coupled ? p.mode : "—"}
                </p>
              </article>
            );
          })}
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

function BriefingDialog({
  name,
  brief,
  onName,
  onBrief,
}: {
  name: string;
  brief: string;
  onName: (v: string) => void;
  onBrief: (v: string) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="pill">
          Briefing
        </Button>
      </DialogTrigger>
      <DialogContent title="Briefing da empresa">
        <p className="mb-4 text-sm leading-relaxed text-muted">
          Os cinco agentes leem isto em toda conversa. É o briefing da casa.
        </p>
        <label className="kicker text-muted" htmlFor="ws-name">
          Nome do espaço
        </label>
        <Input
          id="ws-name"
          className="mt-2 mb-4"
          value={name}
          onChange={(e) => onName(e.target.value)}
        />
        <label className="kicker text-muted" htmlFor="ws-brief">
          O que o estúdio faz
        </label>
        <Textarea
          id="ws-brief"
          className="mt-2 min-h-40"
          value={brief}
          onChange={(e) => onBrief(e.target.value)}
        />
      </DialogContent>
    </Dialog>
  );
}
