import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DoorToggle } from "@/components/door-toggle";
import { PlusMarks } from "@/components/plus-marks";
import { Button } from "@/components/ui/button";
import { GAP_LABEL, ORIGIN_LABEL, STAGE_LABEL, STAGE_ORDER } from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import { listConversations, updateCrm } from "@/lib/polvo/server";
import type { Conversation, PipelineStage } from "@/lib/polvo/types";
import { cn, formatRelative } from "@/lib/utils";

export const Route = createFileRoute("/crm")({ component: CrmBoard });

function CrmBoard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<PipelineStage | null>(null);

  async function load() {
    try {
      setItems(await listConversations({ data: {} }));
    } catch (err) {
      toast.error(polvoError(err));
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function move(id: string, stage: PipelineStage) {
    const current = items?.find((c) => c.id === id);
    if (!current || current.stage === stage) return;
    setItems((prev) => prev?.map((c) => (c.id === id ? { ...c, stage } : c)) ?? null);
    try {
      const next = await updateCrm({ data: { id, stage } });
      setItems((prev) => prev?.map((c) => (c.id === id ? next : c)) ?? null);
    } catch (err) {
      toast.error(polvoError(err));
      await load();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-8">
      <header className="relative px-2 py-4 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">CRM · quadro</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Funil</h1>
          <div className="flex flex-wrap items-center gap-2">
            <DoorToggle />
            <Button asChild variant="outline" size="pill">
              <Link to="/inbox">Mensagens</Link>
            </Button>
          </div>
        </div>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          Arraste o cartão para mudar o pé da meada. Clique para abrir a conversa. É o mesmo dado da
          caixa.
        </p>
      </header>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-6">
        {STAGE_ORDER.map((stage) => {
          const cards = items?.filter((c) => c.stage === stage) ?? [];
          return (
            <section
              key={stage}
              className={cn(
                "flex w-[min(18rem,80vw)] shrink-0 snap-start flex-col rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]",
                over === stage && dragging ? "ring-1 ring-klein" : "",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setDragging(null);
                setOver(null);
                if (id) void move(id, stage);
              }}
            >
              <header className="flex items-baseline justify-between gap-2 px-1 py-2">
                <h2 className="kicker text-muted">{STAGE_LABEL[stage]}</h2>
                <span className="kicker text-subtle tabular-nums">{items ? cards.length : "—"}</span>
              </header>
              <ul className="flex min-h-40 flex-col gap-2">
                {cards.map((c) => (
                  <li key={c.id}>
                    <article
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(c.id);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setOver(null);
                      }}
                      className={cn(
                        "w-full rounded-2xl bg-background p-3 text-left shadow-[var(--shadow-border)] pressable",
                        dragging === c.id ? "opacity-40" : "hover:shadow-[var(--shadow-border-hover)]",
                      )}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => void navigate({ to: "/inbox/$id", params: { id: c.id } })}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium">{c.contactName}</span>
                          <span className="kicker shrink-0 text-subtle">{formatRelative(c.lastAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{c.preview}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="kicker text-subtle">{ORIGIN_LABEL[c.origin]}</span>
                          {c.referredBy ? (
                            <span className="kicker text-subtle">ind. {c.referredBy}</span>
                          ) : null}
                          {c.missing.length > 0 ? (
                            <span className="kicker text-klein">
                              falta {c.missing.slice(0, 2).map((g) => GAP_LABEL[g]).join(", ")}
                            </span>
                          ) : (
                            <span className="kicker text-subtle">ficha ok</span>
                          )}
                        </div>
                      </button>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
