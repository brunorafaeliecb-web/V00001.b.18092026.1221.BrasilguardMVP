import { createFileRoute, Link, Outlet, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConversationList } from "@/components/conversation-list";
import { DoorToggle } from "@/components/door-toggle";
import { NewLeadDialog } from "@/components/new-lead-dialog";
import { PlusMarks } from "@/components/plus-marks";
import { Button } from "@/components/ui/button";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import { listConversations, simulateLead } from "@/lib/polvo/server";
import type { Conversation, PipelineStage } from "@/lib/polvo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
  const params = useParams({ strict: false });
  if (typeof params.id === "string" && params.id.length > 0) {
    return <Outlet />;
  }
  return <InboxList />;
}

function InboxList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [stage, setStage] = useState<PipelineStage | "todos">("todos");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const rows = await listConversations({ data: {} });
      setItems(rows);
    } catch (err) {
      toast.error(polvoError(err));
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSimulate() {
    setBusy(true);
    try {
      const conv = await simulateLead({ data: {} });
      toast.success(`Lead: ${conv.contactName}`);
      await navigate({ to: "/inbox/$id", params: { id: conv.id } });
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(false);
    }
  }

  const visible =
    items?.filter((c) => (stage === "todos" ? true : c.stage === stage)) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8">
      <header className="relative px-2 py-4 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">WhatsApp · mensagens</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Caixa</h1>
          <div className="flex flex-wrap items-center gap-2">
            <DoorToggle />
            <Button asChild variant="outline" size="pill">
              <Link to="/crm">Quadro</Link>
            </Button>
            <Button type="button" size="pill" onClick={() => setOpen(true)}>
              Nova ficha
            </Button>
            <Button type="button" variant="outline" size="pill" onClick={() => void onSimulate()} disabled={busy}>
              {busy ? "Entrando…" : "Simular lead"}
            </Button>
          </div>
        </div>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          Por onde veio, quem indicou, em que pé está, o que falta. Na própria conversa.
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5 px-1">
        <button
          type="button"
          className={cn(
            "h-9 rounded-full px-3 text-xs font-medium pressable",
            stage === "todos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
          )}
          onClick={() => setStage("todos")}
        >
          Todos
        </button>
        {STAGE_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            className={cn(
              "h-9 rounded-full px-3 text-xs font-medium pressable",
              stage === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
            )}
            onClick={() => setStage(id)}
          >
            {STAGE_LABEL[id]}
          </button>
        ))}
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside>
          {visible ? (
            <ConversationList items={visible} />
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-secondary shimmer" />
              ))}
            </div>
          )}
        </aside>
        <div className="hidden place-items-center rounded-2xl bg-card p-10 shadow-[var(--shadow-border)] lg:grid">
          <div className="max-w-sm text-center">
            <p className="kicker text-muted">Thread</p>
            <p className="mt-4 text-2xl font-semibold tracking-tight">Escolha uma conversa</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A ficha fica ao lado. Origem, indicação, estágio e o que ainda falta.
            </p>
          </div>
        </div>
      </div>

      <NewLeadDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(c) => {
          void navigate({ to: "/inbox/$id", params: { id: c.id } });
        }}
      />
    </div>
  );
}
