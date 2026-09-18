import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AGENTS, PROVIDERS } from "@/lib/quatro/catalog";
import { useQuatroStore } from "@/lib/quatro/store";

export function WebBridge() {
  const pending = useQuatroStore((s) => s.pendingBridge);
  const resolve = useQuatroStore((s) => s.resolveBridge);
  const clear = useQuatroStore((s) => s.setPendingBridge);
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);

  if (!pending) return null;

  const provider = PROVIDERS[pending.providerId];
  const agent = AGENTS[pending.agentId];
  const pack = pending.packageText;

  async function copyPack() {
    try {
      await navigator.clipboard.writeText(pack);
      setCopied(true);
      toast.success("Pacote copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não deu para copiar. Selecione o texto.");
    }
  }

  function submit() {
    const text = paste.trim();
    if (!text) {
      toast.error("Cole a resposta da aba oficial.");
      return;
    }
    resolve(text);
    setPaste("");
    toast.success(`${agent.name} registrou a resposta`);
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
      <p className="kicker text-muted">Ponte Web</p>
      <h3 className="mt-2 text-2xl font-medium tracking-tight">
        Pacote para {provider.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Copie, cole em {provider.webHost} com a sua assinatura, e traga a resposta.
        Nada entra na sua conta — o hub só orquestra.
      </p>
      <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-secondary p-3 font-mono text-xs leading-relaxed text-muted whitespace-pre-wrap">
        {pack}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={copyPack} size="sm">
          {copied ? <Check /> : <Copy />}
          Copiar pacote
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={provider.webUrl} target="_blank" rel="noreferrer">
            <ExternalLink />
            Abrir {provider.short}
          </a>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => clear(null)}>
          Cancelar
        </Button>
      </div>
      <label className="mt-4 block text-xs text-muted" htmlFor="bridge-paste">
        Resposta de {provider.short}
      </label>
      <Textarea
        id="bridge-paste"
        className="mt-2"
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder="Cole aqui o texto que o modelo devolveu…"
      />
      <Button type="button" className="mt-3 w-full" onClick={submit}>
        Registrar como {agent.name}
      </Button>
    </div>
  );
}
