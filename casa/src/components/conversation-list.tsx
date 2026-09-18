import { Link } from "@tanstack/react-router";
import { ORIGIN_LABEL, STAGE_LABEL } from "@/lib/polvo/catalog";
import type { Conversation } from "@/lib/polvo/types";
import { cn, formatRelative } from "@/lib/utils";

export function ConversationList({
  items,
  activeId,
}: {
  items: Conversation[];
  activeId?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="px-1 py-8 text-sm leading-relaxed text-muted">
        Caixa vazia. Adicione uma ficha ou simule um lead.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            to="/inbox/$id"
            params={{ id: c.id }}
            className={cn(
              "flex min-h-14 w-full flex-col rounded-2xl px-4 py-3 text-left shadow-[var(--shadow-border)] pressable",
              c.id === activeId ? "bg-secondary" : "bg-card hover:shadow-[var(--shadow-border-hover)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{c.contactName}</span>
              <span className="kicker shrink-0 text-subtle">{formatRelative(c.lastAt)}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{c.preview}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="kicker text-subtle">{ORIGIN_LABEL[c.origin]}</span>
              <span className={cn("kicker", c.stage === "ganho" ? "text-klein" : "text-muted")}>
                {STAGE_LABEL[c.stage]}
              </span>
              {c.missing.length > 0 ? (
                <span className="kicker text-subtle">falta {c.missing.length}</span>
              ) : null}
              {c.unread > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-klein text-[10px] font-medium text-klein-foreground">
                  {c.unread}
                </span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
