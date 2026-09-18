import { createFileRoute } from "@tanstack/react-router";
import { Plug, Unplug } from "lucide-react";
import { toast } from "sonner";
import { PlusMarks } from "@/components/plus-marks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AGENTS, AGENT_ORDER, PROVIDERS, PROVIDER_ORDER } from "@/lib/quatro/catalog";
import { useQuatroStore } from "@/lib/quatro/store";
import type { ProviderId } from "@/lib/quatro/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/provedores")({ component: Provedores });

function Provedores() {
  const providers = useQuatroStore((s) => s.providers);
  const bindings = useQuatroStore((s) => s.bindings);
  const setCoupled = useQuatroStore((s) => s.setCoupled);
  const setMode = useQuatroStore((s) => s.setProviderMode);
  const setKey = useQuatroStore((s) => s.setProviderKey);
  const bindAgent = useQuatroStore((s) => s.bindAgent);
  const resetLocal = useQuatroStore((s) => s.resetLocal);

  const coupledCount = PROVIDER_ORDER.filter((id) => providers[id].coupled).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="relative px-3 py-6 md:px-5 md:py-8">
        <PlusMarks />
        <p className="kicker text-muted">Acoplamento</p>
        <h1 className="text-display mt-4 max-w-3xl">
          <span className="word-stagger">
            <span>Plugue</span>
            <span>e</span>
            <span>desplugue.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
          Cada IA entra ou sai sem derrubar os agentes. Ponte Web usa a assinatura que você já paga
          na aba oficial. API entra quando o faturamento pagar a chave. {coupledCount} de 3 acopladas.
        </p>
      </header>

      <section className="grid gap-3 lg:grid-cols-3">
        {PROVIDER_ORDER.map((id) => (
          <ProviderCard
            key={id}
            id={id}
            onToggle={(on) => {
              if (!on && coupledCount <= 1) {
                toast.error("Deixe pelo menos uma IA acoplada.");
                return;
              }
              setCoupled(id, on);
              toast(on ? `${PROVIDERS[id].short} acoplada` : `${PROVIDERS[id].short} solta`);
            }}
            onMode={(mode) => setMode(id, mode)}
            onKey={(value) => setKey(id, value)}
          />
        ))}
      </section>

      <section>
        <h2 className="text-3xl font-medium tracking-tight">Matriz de agentes</h2>
        <p className="mt-2 mb-5 text-sm text-muted">Toque uma célula para ligar o agente naquela IA.</p>
        <div className="overflow-x-auto rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
          <table className="w-full min-w-3xl text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Agente</th>
                {PROVIDER_ORDER.map((id) => (
                  <th key={id} className="px-3 py-2 font-medium">
                    {PROVIDERS[id].short}
                    {!providers[id].coupled ? (
                      <span className="ml-2 font-normal text-subtle">solta</span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AGENT_ORDER.map((agentId) => (
                <tr key={agentId} className="border-t border-border">
                  <td className="px-3 py-3">
                    <span className="font-medium">{AGENTS[agentId].name}</span>
                    <span className="ml-2 text-muted">{AGENTS[agentId].role}</span>
                  </td>
                  {PROVIDER_ORDER.map((pid) => {
                    const on = bindings[agentId] === pid;
                    const disabled = !providers[pid].coupled;
                    return (
                      <td key={pid} className="px-3 py-3">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => bindAgent(agentId, pid)}
                          className={cn(
                            "h-9 rounded-full px-4 text-xs pressable",
                            on && !disabled
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted",
                            disabled && "opacity-40",
                          )}
                        >
                          {on ? "ligado" : disabled ? "—" : "ligar"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="relative rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]">
        <h2 className="text-3xl font-medium tracking-tight">Como a ponte funciona</h2>
        <ol className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <span className="text-foreground">1.</span> Você escreve no agente. O hub monta um pacote
            com personagem, briefing e histórico.
          </li>
          <li>
            <span className="text-foreground">2.</span> Você cola o pacote no ChatGPT, Gemini ou Grok
            — na conta que você já paga.
          </li>
          <li>
            <span className="text-foreground">3.</span> A resposta volta para o fio do agente. Quando
            faturar, a mesma conversa passa a ir pela chave de API.
          </li>
        </ol>
        <p className="mt-4 text-sm text-subtle">
          O hub não entra na sua sessão. Assinatura web e API são camadas trocáveis, não um atalho
          disfarçado.
        </p>
        <Button
          type="button"
          variant="ghost"
          className="mt-4"
          onClick={() => {
            resetLocal();
            toast.success("Espaço restaurado ao recorte inicial");
          }}
        >
          Restaurar recorte de demonstração
        </Button>
      </section>
    </div>
  );
}

function ProviderCard({
  id,
  onToggle,
  onMode,
  onKey,
}: {
  id: ProviderId;
  onToggle: (on: boolean) => void;
  onMode: (mode: "api" | "web") => void;
  onKey: (value: string) => void;
}) {
  const meta = PROVIDERS[id];
  const p = useQuatroStore((s) => s.providers[id]);

  return (
    <article className="flex flex-col rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">{meta.name}</h2>
          <p className="mt-1 text-xs text-muted">{meta.plan}</p>
        </div>
        <div className="flex items-center gap-2">
          {p.coupled ? <Plug className="size-4 text-klein" /> : <Unplug className="size-4 text-muted" />}
          <Switch checked={p.coupled} onCheckedChange={onToggle} aria-label={`Acoplar ${meta.short}`} />
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-muted">
        {meta.extract.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="mt-5 flex rounded-full bg-secondary p-1">
        {(["web", "api"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onMode(mode)}
            className={cn(
              "h-9 flex-1 rounded-full text-xs pressable",
              p.mode === mode ? "bg-card text-foreground shadow-[var(--shadow-border)]" : "text-muted",
            )}
          >
            {mode === "web" ? "Ponte Web" : "API"}
          </button>
        ))}
      </div>
      {meta.needsUserKey && p.mode === "api" ? (
        <div className="mt-3">
          <label className="text-xs text-muted" htmlFor={`key-${id}`}>
            Chave de API {meta.short}
          </label>
          <Input
            id={`key-${id}`}
            className="mt-1"
            type="password"
            autoComplete="off"
            placeholder="sk-… ou AIza…"
            value={p.apiKey}
            onChange={(e) => onKey(e.target.value)}
          />
          <p className="mt-1 text-xs text-subtle">Fica só neste navegador. O servidor vê na hora do envio.</p>
        </div>
      ) : null}
      {!meta.needsUserKey && p.mode === "api" ? (
        <p className="mt-3 text-xs text-muted">API do SuperGrok já está neste hub. Sem cola de chave.</p>
      ) : null}
    </article>
  );
}
