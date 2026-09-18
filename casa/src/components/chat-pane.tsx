import { ArrowUp, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { WebBridge } from "@/components/web-bridge";
import { AGENTS, PROVIDERS } from "@/lib/quatro/catalog";
import { runAgentTurn } from "@/lib/quatro/run";
import { useQuatroStore } from "@/lib/quatro/store";
import type { AgentId } from "@/lib/quatro/types";
import { cn, formatClock } from "@/lib/utils";

export function ChatPane({
  agentId,
  threadId,
  extra,
  emptyHint,
}: {
  agentId: AgentId;
  threadId: string;
  extra?: string;
  emptyHint?: string;
}) {
  const thread = useQuatroStore((s) => s.threads.find((th) => th.id === threadId));
  const pending = useQuatroStore((s) => s.pendingBridge);
  const bindingId = useQuatroStore((s) => s.bindings[agentId]);
  const provider = useQuatroStore((s) => s.providers[bindingId]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useQuatroStore.getState().ensureThread(threadId, {
      agentId,
      title: AGENTS[agentId].role,
      source: "chat",
    });
  }, [agentId, threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length, pending, busy]);

  async function send() {
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    setBusy(true);
    const result = await runAgentTurn({
      agentId,
      threadId,
      userText: value,
      extra,
    });
    setBusy(false);
    if (result.error) toast.error(result.error);
  }

  const agent = AGENTS[agentId];
  const messages = thread?.messages ?? [];
  const showBridge = pending?.threadId === threadId;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && !showBridge ? (
          <p className="pt-6 text-sm text-muted">{emptyHint ?? `Fale com ${agent.name}.`}</p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-xl rounded-2xl px-4 py-3",
                m.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md bg-secondary text-foreground",
              )}
            >
              {m.role === "assistant" ? (
                <Markdown text={m.content} className="text-foreground" />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              )}
              <p
                className={cn(
                  "mt-2 font-mono text-xs tabular-nums",
                  m.role === "user" ? "text-primary-foreground/60" : "text-subtle",
                )}
              >
                {formatClock(m.createdAt)}
                {m.providerId ? ` · ${PROVIDERS[m.providerId].short}` : ""}
                {m.mode === "web" ? " · web" : m.mode === "api" ? " · api" : ""}
              </p>
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <LoaderCircle className="size-4 animate-spin" />
            {agent.name} pensando
          </div>
        ) : null}
        {showBridge ? <WebBridge /> : null}
        <div ref={endRef} />
      </div>
      <form
        className="mt-4 flex items-end gap-2 rounded-2xl bg-card p-2 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="sr-only" htmlFor={`composer-${threadId}`}>
          Mensagem para {agent.name}
        </label>
        <textarea
          id={`composer-${threadId}`}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={
            provider.coupled
              ? provider.mode === "web"
                ? `Escreva. ${PROVIDERS[bindingId].short} entra pela Ponte Web.`
                : `Mensagem para ${agent.name}`
              : "Acopla uma IA para conversar"
          }
          disabled={!provider.coupled || busy}
          className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-subtle"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || busy || !provider.coupled}
          aria-label="Enviar"
        >
          <ArrowUp />
        </Button>
      </form>
    </div>
  );
}
