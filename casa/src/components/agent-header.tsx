import { Link } from "@tanstack/react-router";
import { Unplug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AGENTS, PROVIDERS } from "@/lib/quatro/catalog";
import { useQuatroStore } from "@/lib/quatro/store";
import type { AgentId } from "@/lib/quatro/types";

export function AgentHeader({ agentId }: { agentId: AgentId }) {
  const agent = AGENTS[agentId];
  const providerId = useQuatroStore((s) => s.bindings[agentId]);
  const provider = useQuatroStore((s) => s.providers[providerId]);
  const meta = PROVIDERS[providerId];

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="kicker text-muted">{agent.role}</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">{agent.name}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">{agent.blurb}</p>
      </div>
      <Link
        to="/provedores"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm shadow-[var(--shadow-border)] pressable"
      >
        <span
          className="size-2 rounded-full"
          style={{ background: provider.coupled ? "var(--color-klein)" : "var(--color-destructive)" }}
        />
        {meta.short}
        <Badge>{provider.coupled ? (provider.mode === "api" ? "API" : "Ponte Web") : "solto"}</Badge>
        <Unplug className="size-3.5 text-muted" />
      </Link>
    </header>
  );
}
