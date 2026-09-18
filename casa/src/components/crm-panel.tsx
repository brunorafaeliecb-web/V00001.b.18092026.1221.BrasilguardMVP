import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  GAP_LABEL,
  GAP_ORDER,
  ORIGIN_LABEL,
  ORIGIN_ORDER,
  STAGE_LABEL,
  STAGE_ORDER,
} from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import { deleteConversation, updateCrm } from "@/lib/polvo/server";
import type {
  ContactKind,
  Conversation,
  GapId,
  LeadOrigin,
  PipelineStage,
} from "@/lib/polvo/types";
import { cn } from "@/lib/utils";

export function CrmPanel({
  conversation,
  onChange,
  onDeleted,
}: {
  conversation: Conversation;
  onChange: (next: Conversation) => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(conversation.contactName);
  const [handle, setHandle] = useState(conversation.contactHandle);
  const [kind, setKind] = useState<ContactKind>(conversation.contactKind);
  const [origin, setOrigin] = useState<LeadOrigin>(conversation.origin);
  const [referredBy, setReferredBy] = useState(conversation.referredBy);
  const [stage, setStage] = useState<PipelineStage>(conversation.stage);
  const [city, setCity] = useState(conversation.city);
  const [plan, setPlan] = useState(conversation.currentPlan);
  const [lives, setLives] = useState(conversation.lives == null ? "" : String(conversation.lives));
  const [missing, setMissing] = useState<GapId[]>(conversation.missing);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    setName(conversation.contactName);
    setHandle(conversation.contactHandle);
    setKind(conversation.contactKind);
    setOrigin(conversation.origin);
    setReferredBy(conversation.referredBy);
    setStage(conversation.stage);
    setCity(conversation.city);
    setPlan(conversation.currentPlan);
    setLives(conversation.lives == null ? "" : String(conversation.lives));
    setMissing(conversation.missing);
  }, [conversation.id, conversation.lastAt, conversation.missing.join("|")]);

  async function save(extra?: {
    origin?: LeadOrigin;
    stage?: PipelineStage;
    contactKind?: ContactKind;
    missing?: GapId[];
  }) {
    setBusy(true);
    try {
      const parsed = Number.parseInt(lives, 10);
      const livesVal = lives.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
      const next = await updateCrm({
        data: {
          id: conversation.id,
          contactName: name,
          contactHandle: handle,
          contactKind: extra?.contactKind ?? kind,
          origin: extra?.origin ?? origin,
          referredBy,
          stage: extra?.stage ?? stage,
          city,
          currentPlan: plan,
          lives: livesVal,
          missing: extra?.missing ?? missing,
        },
      });
      onChange(next);
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteConversation({ data: { id: conversation.id } });
      toast.success("Ficha removida.");
      onDeleted();
    } catch (err) {
      toast.error(polvoError(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="kicker text-muted">Ficha</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight">O pé da meada</h2>
      </div>

      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => void save()} />
      </Field>
      <Field label="WhatsApp">
        <Input value={handle} onChange={(e) => setHandle(e.target.value)} onBlur={() => void save()} />
      </Field>

      <Field label="Tipo">
        <PillRow>
          {(["pf", "pj"] as const).map((k) => (
            <Pill
              key={k}
              active={kind === k}
              onClick={() => {
                setKind(k);
                void save({ contactKind: k });
              }}
            >
              {k.toUpperCase()}
            </Pill>
          ))}
        </PillRow>
      </Field>

      <Field label="Por onde veio">
        <PillRow>
          {ORIGIN_ORDER.map((id) => (
            <Pill
              key={id}
              active={origin === id}
              onClick={() => {
                setOrigin(id);
                void save({ origin: id });
              }}
            >
              {ORIGIN_LABEL[id]}
            </Pill>
          ))}
        </PillRow>
      </Field>

      <Field label="Quem indicou">
        <Input
          placeholder="Nome, se houver"
          value={referredBy}
          onChange={(e) => setReferredBy(e.target.value)}
          onBlur={() => void save()}
        />
      </Field>

      <Field label="Estágio">
        <PillRow>
          {STAGE_ORDER.map((id) => (
            <Pill
              key={id}
              active={stage === id}
              onClick={() => {
                setStage(id);
                void save({ stage: id });
              }}
            >
              {STAGE_LABEL[id]}
            </Pill>
          ))}
        </PillRow>
      </Field>

      <Field label="Cidade">
        <Input value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => void save()} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vidas">
          <Input
            inputMode="numeric"
            value={lives}
            onChange={(e) => setLives(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => void save()}
            placeholder="—"
          />
        </Field>
        <Field label="Plano atual">
          <Input value={plan} onChange={(e) => setPlan(e.target.value)} onBlur={() => void save()} />
        </Field>
      </div>

      <Field label="O que falta">
        <PillRow>
          {GAP_ORDER.map((id) => (
            <Pill
              key={id}
              active={missing.includes(id)}
              onClick={() => {
                const next = missing.includes(id) ? missing.filter((g) => g !== id) : [...missing, id];
                setMissing(next);
                void save({ missing: next });
              }}
            >
              {GAP_LABEL[id]}
            </Pill>
          ))}
        </PillRow>
        <p className="mt-2 text-xs leading-relaxed text-subtle">
          Marcado = ainda não está na conversa. A Ana pergunta o que falta.
        </p>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void save()}>
          {busy ? "Salvando…" : "Salvar ficha"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirm(true)}>
          Remover
        </Button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title="Remover ficha">
          <p className="text-sm leading-relaxed text-muted">
            Some a conversa e a ficha de {conversation.contactName}. Não dá para desfazer.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirm(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onDelete()}>
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="kicker text-subtle">{label}</span>
      {children}
    </div>
  );
}

function PillRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full px-3 text-xs font-medium tracking-wide pressable",
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
