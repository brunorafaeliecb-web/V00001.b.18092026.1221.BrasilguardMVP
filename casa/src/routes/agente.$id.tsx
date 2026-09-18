import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AgentHeader } from "@/components/agent-header";
import { ChatPane } from "@/components/chat-pane";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENT_ORDER, CARLA_TOPICS, CATIA_TOPICS } from "@/lib/quatro/catalog";
import { runAgentTurn } from "@/lib/quatro/run";
import { useQuatroStore } from "@/lib/quatro/store";
import type { AgentId, Campaign, SocialPost, Ticket } from "@/lib/quatro/types";
import { cn, formatDay } from "@/lib/utils";

export const Route = createFileRoute("/agente/$id")({ component: AgentPage });

function isAgentId(id: string): id is AgentId {
  return (AGENT_ORDER as string[]).includes(id);
}

function AgentPage() {
  const { id } = Route.useParams();
  if (!isAgentId(id)) return <Navigate to="/" />;
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-1 flex-col">
      <AgentHeader agentId={id} />
      {id === "ana" ? <AnaWorkspace /> : null}
      {id === "carla" ? (
        <ConsultorWorkspace
          agentId="carla"
          threadId="th-carla-main"
          topics={CARLA_TOPICS}
          hint="Pergunte sobre MEI, PF ou o momento de abrir CNPJ."
        />
      ) : null}
      {id === "catia" ? (
        <ConsultorWorkspace
          agentId="catia"
          threadId="th-catia-main"
          topics={CATIA_TOPICS}
          hint="Pergunte sobre LTDA, contrato, nota ou imposto de PJ."
        />
      ) : null}
      {id === "taiz" ? <TaizWorkspace /> : null}
      {id === "simone" ? <SimoneWorkspace /> : null}
    </div>
  );
}

function AnaWorkspace() {
  const tickets = useQuatroStore((s) => s.tickets);
  const openTicketThread = useQuatroStore((s) => s.openTicketThread);
  const setStatus = useQuatroStore((s) => s.setTicketStatus);
  const [active, setActive] = useState(tickets[0]?.id ?? "");
  const ticket = tickets.find((t) => t.id === active);

  function select(tk: Ticket) {
    openTicketThread(tk.id);
    setActive(tk.id);
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="flex max-h-56 flex-col gap-2 overflow-y-auto lg:max-h-none">
        {tickets.map((tk) => (
          <button
            key={tk.id}
            type="button"
            onClick={() => select(tk)}
            className={cn(
              "rounded-xl p-3 text-left shadow-[var(--shadow-border)] pressable",
              tk.id === active ? "bg-secondary" : "bg-card",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{tk.name}</span>
              <Badge>{tk.channel}</Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{tk.preview}</p>
            <p className="mt-2 text-xs text-subtle">{tk.status.replace("_", " ")}</p>
          </button>
        ))}
      </aside>
      <div className="flex min-h-96 flex-col rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] lg:min-h-0">
        {ticket ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{ticket.name}</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setStatus(ticket.id, "resolvido")}
              >
                Resolver
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setStatus(ticket.id, "handoff");
                  toast.success("Marcado para handoff — abra Carla, Cátia ou Taiz");
                }}
              >
                Handoff
              </Button>
            </div>
            <ChatPane
              agentId="ana"
              threadId={ticket.threadId}
              extra={`Ticket de ${ticket.name} via ${ticket.channel}. Status: ${ticket.status}. Pedido: ${ticket.preview}`}
              emptyHint="Responda o lead. Ana qualifica e não inventa preço."
            />
          </>
        ) : (
          <p className="text-sm text-muted">Selecione um ticket.</p>
        )}
      </div>
    </div>
  );
}

function ConsultorWorkspace({
  agentId,
  threadId,
  topics,
  hint,
}: {
  agentId: "carla" | "catia";
  threadId: string;
  topics: { id: string; label: string; prompt: string }[];
  hint: string;
}) {
  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3">
        <p className="text-xs leading-relaxed text-muted">
          Orientação estratégica. Não substitui contador ou advogado.
        </p>
        <div className="flex flex-col gap-2">
          {topics.map((topic) => (
            <TopicButton
              key={topic.id}
              agentId={agentId}
              threadId={threadId}
              prompt={topic.prompt}
              label={topic.label}
            />
          ))}
        </div>
      </aside>
      <div className="flex min-h-96 flex-col rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] lg:min-h-0">
        <ChatPane agentId={agentId} threadId={threadId} emptyHint={hint} />
      </div>
    </div>
  );
}

function TopicButton({
  agentId,
  threadId,
  prompt,
  label,
}: {
  agentId: "carla" | "catia";
  threadId: string;
  prompt: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto justify-start py-2 text-left whitespace-normal"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await runAgentTurn({ agentId, threadId, userText: prompt });
        setBusy(false);
        if (result.error) toast.error(result.error);
      }}
    >
      {label}
    </Button>
  );
}

function TaizWorkspace() {
  const campaigns = useQuatroStore((s) => s.campaigns);
  const ensureThread = useQuatroStore((s) => s.ensureThread);
  const [active, setActive] = useState(campaigns[0]?.id ?? "");
  const campaign = campaigns.find((c) => c.id === active);

  function select(c: Campaign) {
    ensureThread(c.threadId, { agentId: "taiz", title: c.name, source: "campaign" });
    setActive(c.id);
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="flex max-h-56 flex-col gap-2 overflow-y-auto lg:max-h-none">
        {campaigns.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c)}
            className={cn(
              "rounded-xl p-3 text-left shadow-[var(--shadow-border)] pressable",
              c.id === active ? "bg-secondary" : "bg-card",
            )}
          >
            <p className="text-sm font-medium">{c.name}</p>
            <p className="mt-1 text-xs text-muted">
              {c.platform} · {c.objective}
            </p>
            <p className="mt-2 text-xs text-subtle">{c.status}</p>
          </button>
        ))}
      </aside>
      <div className="flex min-h-96 flex-col rounded-2xl bg-card p-4 shadow-[var(--shadow-border)] lg:min-h-0">
        {campaign ? (
          <CampaignChat campaign={campaign} />
        ) : (
          <p className="text-sm text-muted">Selecione uma campanha.</p>
        )}
      </div>
    </div>
  );
}

function CampaignChat({ campaign }: { campaign: Campaign }) {
  const setOutput = useQuatroStore((s) => s.setCampaignOutput);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    const result = await runAgentTurn({
      agentId: "taiz",
      threadId: campaign.threadId,
      userText: `Monte a campanha completa a partir deste brief:\n${campaign.brief}`,
      extra: `Campanha ${campaign.name}. Plataforma ${campaign.platform}. Objetivo: ${campaign.objective}.`,
    });
    setBusy(false);
    if (result.error) toast.error(result.error);
    if (result.mode === "api") {
      const thread = useQuatroStore.getState().threads.find((th) => th.id === campaign.threadId);
      const last = [...(thread?.messages ?? [])].reverse().find((m) => m.role === "assistant");
      if (last) setOutput(campaign.id, last.content);
    }
  }

  return (
    <>
      <div className="mb-3">
        <p className="text-sm leading-relaxed text-muted">{campaign.brief}</p>
        <Button type="button" size="sm" className="mt-3" onClick={() => void generate()} disabled={busy}>
          Gerar plano de mídia
        </Button>
      </div>
      <ChatPane
        agentId="taiz"
        threadId={campaign.threadId}
        extra={`Campanha ${campaign.name} · ${campaign.platform}. Brief: ${campaign.brief}`}
        emptyHint="Peça público, criativos, verba e KPI de 7 dias."
      />
    </>
  );
}

function SimoneWorkspace() {
  const posts = useQuatroStore((s) => s.posts);
  const ensureThread = useQuatroStore((s) => s.ensureThread);
  const [active, setActive] = useState(posts[0]?.id ?? "");
  const post = posts.find((p) => p.id === active);

  function select(p: SocialPost) {
    ensureThread(p.threadId, { agentId: "simone", title: p.title, source: "post" });
    setActive(p.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {posts.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => select(p)}
            className={cn(
              "min-w-40 shrink-0 rounded-xl p-3 text-left shadow-[var(--shadow-border)] pressable",
              p.id === active ? "bg-secondary" : "bg-card",
            )}
          >
            <p className="text-xs text-muted">{formatDay(p.date)}</p>
            <p className="mt-1 text-sm font-medium">{p.title}</p>
            <p className="mt-1 text-xs text-subtle">
              {p.channel} · {p.status}
            </p>
          </button>
        ))}
      </div>
      <div className="flex min-h-96 flex-1 flex-col rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
        {post ? <PostChat post={post} /> : null}
      </div>
    </div>
  );
}

function PostChat({ post }: { post: SocialPost }) {
  const setCaption = useQuatroStore((s) => s.setPostCaption);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    const result = await runAgentTurn({
      agentId: "simone",
      threadId: post.threadId,
      userText: `Escreva a peça "${post.title}" para ${post.channel}. Entregue gancho, legenda, CTA e versão curta de story.`,
    });
    setBusy(false);
    if (result.error) toast.error(result.error);
    if (result.mode === "api") {
      const thread = useQuatroStore.getState().threads.find((th) => th.id === post.threadId);
      const last = [...(thread?.messages ?? [])].reverse().find((m) => m.role === "assistant");
      if (last) setCaption(post.id, last.content);
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{post.title}</p>
          <p className="text-xs text-muted">
            {formatDay(post.date)} · {post.channel}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => void generate()} disabled={busy}>
          Escrever peça
        </Button>
      </div>
      <ChatPane
        agentId="simone"
        threadId={post.threadId}
        extra={`Peça "${post.title}" no ${post.channel}.`}
        emptyHint="Peça gancho, legenda e CTA — sem hashtag demais."
      />
    </>
  );
}
