import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { PlusMarks } from "@/components/plus-marks";
import { WebBridge } from "@/components/web-bridge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { completeChat } from "@/lib/ai/complete";
import { AGENTS, AGENT_ORDER, SALA_PRESETS } from "@/lib/quatro/catalog";
import { buildSalaPackage, SYNTHESIS_SYSTEM } from "@/lib/quatro/prompts";
import { runAgentTurn } from "@/lib/quatro/run";
import { useQuatroStore } from "@/lib/quatro/store";
import type { AgentId, SalaTurn } from "@/lib/quatro/types";
import { cn, uid } from "@/lib/utils";

export const Route = createFileRoute("/sala")({ component: Sala });

function Sala() {
  const sala = useQuatroStore((s) => s.sala);
  const setSala = useQuatroStore((s) => s.setSala);
  const patch = useQuatroStore((s) => s.patchSalaTurn);
  const setSynthesis = useQuatroStore((s) => s.setSalaSynthesis);
  const bindings = useQuatroStore((s) => s.bindings);
  const providers = useQuatroStore((s) => s.providers);
  const briefCompany = useQuatroStore((s) => s.companyBrief);
  const pending = useQuatroStore((s) => s.pendingBridge);
  const [brief, setBrief] = useState(SALA_PRESETS[0].brief);
  const [picked, setPicked] = useState<AgentId[]>([...AGENT_ORDER]);
  const [busy, setBusy] = useState(false);

  function toggle(id: AgentId) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function fire() {
    const text = brief.trim();
    if (!text) {
      toast.error("Escreva a missão.");
      return;
    }
    if (picked.length === 0) {
      toast.error("Escolha pelo menos um agente.");
      return;
    }
    const sessionId = uid();
    const turns: SalaTurn[] = picked.map((agentId) => ({
      agentId,
      content: "",
      status: "idle",
    }));
    setSala({
      id: sessionId,
      brief: text,
      agentIds: picked,
      turns,
      synthesis: "",
      createdAt: Date.now(),
    });
    setBusy(true);

    const prior: { agentId: AgentId; content: string }[] = [];
    for (const agentId of picked) {
      const threadId = `sala-${sessionId}-${agentId}`;
      useQuatroStore.getState().ensureThread(threadId, {
        agentId,
        title: `Sala · ${AGENTS[agentId].name}`,
        source: "sala",
      });
      const extra = `Missão da sala de guerra:\n${text}${
        prior.length
          ? `\n\nO que os outros já disseram:\n${prior.map((p) => `${AGENTS[p.agentId].name}: ${p.content}`).join("\n\n")}`
          : ""
      }\n\nEntregue só a sua parte.`;
      const result = await runAgentTurn({
        agentId,
        threadId,
        userText: text,
        extra,
      });
      if (result.error) {
        patch(agentId, { content: result.error, status: "done" });
        toast.error(`${AGENTS[agentId].name}: ${result.error}`);
        continue;
      }
      if (result.mode === "web") {
        const providerId = bindings[agentId];
        const packageText = buildSalaPackage({
          agentId,
          providerId,
          companyBrief: briefCompany,
          brief: text,
          prior,
        });
        patch(agentId, { status: "waiting-web", packageText });
        toast.message(`${AGENTS[agentId].name} espera a Ponte Web`);
        setBusy(false);
        return;
      }
      const thread = useQuatroStore.getState().threads.find((th) => th.id === threadId);
      const last = [...(thread?.messages ?? [])].reverse().find((m) => m.role === "assistant");
      const content = last?.content ?? "";
      patch(agentId, { content, status: "done" });
      prior.push({ agentId, content });
    }
    setBusy(false);
  }

  async function synthesize() {
    const current = useQuatroStore.getState().sala;
    if (!current) return;
    const done = current.turns.filter((t) => t.content);
    if (done.length === 0) {
      toast.error("Ainda não há pareceres.");
      return;
    }
    setBusy(true);
    const grok = useQuatroStore.getState().providers.grok;
    if (!grok.coupled || grok.mode !== "api") {
      setBusy(false);
      toast.error("A síntese usa SuperGrok em API. Acopla o Grok em modo API.");
      return;
    }
    const result = await completeChat({
      data: {
        provider: "grok",
        system: SYNTHESIS_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Missão:\n${current.brief}\n\nPareceres:\n${done
              .map((t) => `## ${AGENTS[t.agentId].name}\n${t.content}`)
              .join("\n\n")}`,
          },
        ],
      },
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSynthesis(result.text);
  }

  async function continueAfterWeb() {
    const current = useQuatroStore.getState().sala;
    if (!current) return;
    const waiting = current.turns.find((t) => t.status === "waiting-web");
    if (!waiting) return;
    const threadId = `sala-${current.id}-${waiting.agentId}`;
    const thread = useQuatroStore.getState().threads.find((th) => th.id === threadId);
    const last = [...(thread?.messages ?? [])].reverse().find((m) => m.role === "assistant");
    if (!last) {
      toast.error("Registre a resposta da ponte primeiro.");
      return;
    }
    patch(waiting.agentId, { content: last.content, status: "done" });
    const remaining = current.agentIds.slice(current.agentIds.indexOf(waiting.agentId) + 1);
    const prior = current.turns
      .filter((t) => t.status === "done" && t.content)
      .map((t) => ({ agentId: t.agentId, content: t.content }))
      .concat([{ agentId: waiting.agentId, content: last.content }]);
    setBusy(true);
    for (const agentId of remaining) {
      const tid = `sala-${current.id}-${agentId}`;
      useQuatroStore.getState().ensureThread(tid, {
        agentId,
        title: `Sala · ${AGENTS[agentId].name}`,
        source: "sala",
      });
      const extra = `Missão da sala de guerra:\n${current.brief}\n\nO que os outros já disseram:\n${prior
        .map((p) => `${AGENTS[p.agentId].name}: ${p.content}`)
        .join("\n\n")}`;
      const result = await runAgentTurn({
        agentId,
        threadId: tid,
        userText: current.brief,
        extra,
      });
      if (result.mode === "web") {
        patch(agentId, { status: "waiting-web" });
        setBusy(false);
        toast.message(`${AGENTS[agentId].name} espera a Ponte Web`);
        return;
      }
      if (result.error) {
        patch(agentId, { content: result.error, status: "done" });
        continue;
      }
      const th = useQuatroStore.getState().threads.find((x) => x.id === tid);
      const ans = [...(th?.messages ?? [])].reverse().find((m) => m.role === "assistant");
      const content = ans?.content ?? "";
      patch(agentId, { content, status: "done" });
      prior.push({ agentId, content });
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="relative px-3 py-6 md:px-5 md:py-8">
        <PlusMarks />
        <p className="kicker text-muted">Sala de guerra</p>
        <h1 className="text-display mt-4 max-w-3xl">
          <span className="word-stagger">
            <span>Uma</span>
            <span>missão,</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d2">
            <span>cinco</span>
            <span>vozes.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          Os agentes falam em sequência. Quem estiver em Ponte Web pausa a ronda até você colar a
          resposta. No fim, o Grok sintetiza o plano.
        </p>
      </header>

      <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex flex-wrap gap-2">
          {SALA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setBrief(preset.brief)}
              className="h-9 rounded-full bg-secondary px-4 text-xs pressable"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          className="min-h-32"
          placeholder="Descreva a missão…"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {AGENT_ORDER.map((id) => {
            const on = picked.includes(id);
            const pid = bindings[id];
            const mode = providers[pid]?.coupled ? providers[pid].mode : "solto";
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={cn(
                  "h-10 rounded-full px-4 text-sm pressable",
                  on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
                )}
              >
                {AGENTS[id].name}
                <span className="ml-2 text-xs opacity-70">{mode}</span>
              </button>
            );
          })}
        </div>
        <Button type="button" className="mt-4" size="pill" onClick={() => void fire()} disabled={busy}>
          Disparar ronda
        </Button>
      </section>

      {pending ? <WebBridge /> : null}
      {sala?.turns.some((t) => t.status === "waiting-web") && !pending ? (
        <Button type="button" variant="outline" onClick={() => void continueAfterWeb()}>
          Continuar ronda
        </Button>
      ) : null}

      {sala ? (
        <section className="grid gap-3 md:grid-cols-2">
          {sala.turns.map((turn) => (
            <article key={turn.agentId} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium tracking-tight">{AGENTS[turn.agentId].name}</h2>
                <span className="font-mono text-xs tracking-widest text-muted uppercase">
                  {turn.status === "done"
                    ? "pronto"
                    : turn.status === "waiting-web"
                      ? "ponte web"
                      : "na fila"}
                </span>
              </div>
              {turn.content ? (
                <Markdown className="mt-3" text={turn.content} />
              ) : (
                <p className="mt-3 text-sm text-muted">Aguardando parecer.</p>
              )}
            </article>
          ))}
        </section>
      ) : null}

      {sala ? (
        <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-medium tracking-tight">Síntese</h2>
            <Button type="button" size="sm" onClick={() => void synthesize()} disabled={busy}>
              Sintetizar
            </Button>
          </div>
          {sala.synthesis ? (
            <Markdown className="mt-4" text={sala.synthesis} />
          ) : (
            <p className="mt-3 text-sm text-muted">Quando as vozes chegarem, una o plano aqui.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
