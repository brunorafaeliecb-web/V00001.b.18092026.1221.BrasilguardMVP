import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ConversationList } from "@/components/conversation-list";
import { CrmPanel } from "@/components/crm-panel";
import { NewLeadDialog } from "@/components/new-lead-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { AGENT_HANDOFF_LABEL, GAP_LABEL, ORIGIN_LABEL, STAGE_LABEL } from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import {
  addInternalNote,
  draftAnaReply,
  getConversation,
  listConversations,
  sendMessage,
  simulateLead,
  updateConversation,
} from "@/lib/polvo/server";
import type { Conversation, Message } from "@/lib/polvo/types";
import { cn, formatClock } from "@/lib/utils";

export const Route = createFileRoute("/inbox/$id")({ component: ThreadPage });

function ThreadPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<Conversation[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [ficha, setFicha] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  async function loadThread(cid: string) {
    const data = await getConversation({ data: { id: cid } });
    setConversation(data.conversation);
    setMessages(data.messages);
  }

  async function loadList() {
    const rows = await listConversations({ data: {} });
    setList(rows);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadThread(id), loadList()]).catch((err) => {
      if (!cancelled) toast.error(polvoError(err));
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function submitBody() {
    if (!body.trim()) return;
    setBusy("send");
    try {
      const result = await sendMessage({ data: { conversationId: id, body: body.trim() } });
      setMessages((m) => [...m, result.message]);
      setConversation(result.conversation);
      setBody("");
      await loadList();
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    await submitBody();
  }

  async function onAna() {
    setBusy("ana");
    try {
      const result = await draftAnaReply({ data: { conversationId: id } });
      setMessages((m) => [...m, result.message]);
      setConversation(result.conversation);
      await loadList();
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onHandoff(agent: "carla" | "catia") {
    setBusy(agent);
    try {
      const next = await updateConversation({
        data: { id, assignedAgent: agent, status: "handoff" },
      });
      setConversation(next);
      const noteMsg = await addInternalNote({
        data: { conversationId: id, body: `Passado para ${AGENT_HANDOFF_LABEL[agent]}.` },
      });
      setMessages((m) => [...m, noteMsg]);
      await loadList();
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onResolve() {
    setBusy("resolve");
    try {
      const next = await updateConversation({ data: { id, status: "resolvido" } });
      setConversation(next);
      await loadList();
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setBusy("note");
    try {
      const msg = await addInternalNote({ data: { conversationId: id, body: note.trim() } });
      setMessages((m) => [...m, msg]);
      setNote("");
      setNoteOpen(false);
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(null);
    }
  }

  async function onSimulate() {
    setBusy("sim");
    try {
      const conv = await simulateLead({ data: {} });
      toast.success(`Lead: ${conv.contactName}`);
      await navigate({ to: "/inbox/$id", params: { id: conv.id } });
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="-mx-5 flex min-h-[calc(100dvh-8rem)] flex-1 flex-col md:-mx-12 md:min-h-[calc(100dvh-9rem)]">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <aside className="hidden min-h-0 flex-col border-r border-border px-4 py-4 lg:flex">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="kicker text-muted">WhatsApp</p>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" onClick={() => setNewOpen(true)}>
                Nova
              </Button>
              <Button type="button" variant="ghost" onClick={() => void onSimulate()} disabled={Boolean(busy)}>
                Simular
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <ConversationList items={list} activeId={id} />
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-start gap-3 border-b border-border px-4 py-3 md:px-6">
            <Link
              to="/inbox"
              className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-secondary pressable lg:hidden"
              aria-label="Voltar à caixa"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold tracking-tight">
                {conversation?.contactName ?? "…"}
              </p>
              <p className="truncate text-xs text-muted">
                {conversation?.contactHandle}
                {conversation ? ` · ${ORIGIN_LABEL[conversation.origin]}` : ""}
                {conversation ? ` · ${STAGE_LABEL[conversation.stage]}` : ""}
                {conversation?.referredBy ? ` · ind. ${conversation.referredBy}` : ""}
              </p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/crm">Quadro</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="pill"
              className="xl:hidden"
              onClick={() => setFicha(true)}
            >
              Ficha
            </Button>
          </header>

          <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 md:px-6">
            {conversation && conversation.missing.length > 0 ? (
              <div className="rounded-2xl bg-secondary px-4 py-3">
                <p className="kicker text-subtle">Falta na conversa</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {conversation.missing.map((g) => GAP_LABEL[g]).join(" · ")}
                </p>
              </div>
            ) : null}
            {messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
          </div>

          <div className="border-t border-border px-4 py-3 md:px-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void onAna()} disabled={Boolean(busy)}>
                {busy === "ana" ? "Ana escreve…" : "Ana responde"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => void onHandoff("carla")} disabled={Boolean(busy)}>
                Passar Carla
              </Button>
              <Button type="button" variant="secondary" onClick={() => void onHandoff("catia")} disabled={Boolean(busy)}>
                Passar Cátia
              </Button>
              <Button type="button" variant="outline" onClick={() => void onResolve()} disabled={Boolean(busy)}>
                Resolver
              </Button>
              <Button type="button" variant="ghost" onClick={() => setNoteOpen((v) => !v)}>
                Nota
              </Button>
            </div>
            {noteOpen ? (
              <form className="mb-3 flex gap-2" onSubmit={(e) => void onNote(e)}>
                <Textarea
                  className="min-h-16"
                  placeholder="Nota interna — o lead não vê."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button type="submit" variant="secondary" disabled={Boolean(busy)}>
                  Guardar
                </Button>
              </form>
            ) : null}
            <form className="flex items-end gap-2" onSubmit={(e) => void onSend(e)}>
              <Textarea
                className="min-h-14"
                placeholder="Escreva no WhatsApp…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitBody();
                  }
                }}
              />
              <Button type="submit" disabled={Boolean(busy) || !body.trim()}>
                Enviar
              </Button>
            </form>
          </div>
        </section>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-border px-5 py-6 xl:block">
          {conversation ? (
            <CrmPanel
              conversation={conversation}
              onChange={(next) => {
                setConversation(next);
                void loadList();
              }}
              onDeleted={() => {
                void navigate({ to: "/inbox" });
              }}
            />
          ) : null}
        </aside>
      </div>

      <Sheet open={ficha} onOpenChange={setFicha}>
        <SheetContent title="Ficha" side="bottom">
          <div className="max-h-[70dvh] overflow-y-auto pb-8">
            {conversation ? (
              <CrmPanel
                conversation={conversation}
                onChange={(next) => {
                  setConversation(next);
                  void loadList();
                }}
                onDeleted={() => {
                  setFicha(false);
                  void navigate({ to: "/inbox" });
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <NewLeadDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(c) => {
          void navigate({ to: "/inbox/$id", params: { id: c.id } });
        }}
      />
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  if (message.direction === "note") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-border px-4 py-3 text-center">
        <p className="kicker text-subtle">Nota · {message.authorLabel}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">{message.body}</p>
      </div>
    );
  }
  const outgoing = message.direction === "out";
  return (
    <div className={cn("flex max-w-[84%] flex-col gap-1", outgoing ? "ml-auto items-end" : "mr-auto items-start")}>
      <p className="kicker px-1 text-subtle">
        {message.authorLabel} · {formatClock(new Date(message.createdAt).getTime())}
      </p>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          outgoing
            ? "rounded-br-md bg-klein text-klein-foreground"
            : "rounded-bl-md bg-secondary text-foreground",
        )}
      >
        {message.body}
      </div>
    </div>
  );
}
