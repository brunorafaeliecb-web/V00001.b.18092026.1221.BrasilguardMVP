import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ORIGIN_LABEL, ORIGIN_ORDER } from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import { createLead } from "@/lib/polvo/server";
import type { ContactKind, Conversation, LeadOrigin } from "@/lib/polvo/types";
import { cn } from "@/lib/utils";

export function NewLeadDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (c: Conversation) => void;
}) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [kind, setKind] = useState<ContactKind>("pf");
  const [origin, setOrigin] = useState<LeadOrigin>("whatsapp");
  const [referredBy, setReferredBy] = useState("");
  const [city, setCity] = useState("");
  const [first, setFirst] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const conv = await createLead({
        data: {
          contactName: name.trim(),
          contactHandle: handle.trim(),
          contactKind: kind,
          origin,
          referredBy: referredBy.trim(),
          city: city.trim(),
          firstMessage: first.trim() || undefined,
        },
      });
      toast.success(`Ficha: ${conv.contactName}`);
      setName("");
      setHandle("");
      setReferredBy("");
      setCity("");
      setFirst("");
      setKind("pf");
      setOrigin("whatsapp");
      onOpenChange(false);
      onCreated(conv);
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Nova ficha">
        <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
          <Input required placeholder="Nome do cliente" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            required
            placeholder="WhatsApp · +55 21 …"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <div className="flex gap-2">
            {(["pf", "pj"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className={cn(
                  "h-11 flex-1 rounded-full text-xs font-medium tracking-widest uppercase pressable",
                  kind === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
                )}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <div>
            <p className="kicker mb-2 text-subtle">Por onde veio</p>
            <div className="flex flex-wrap gap-1.5">
              {ORIGIN_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-medium pressable",
                    origin === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted",
                  )}
                  onClick={() => setOrigin(id)}
                >
                  {ORIGIN_LABEL[id]}
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Quem indicou (se houver)" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
          <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
          <Textarea
            className="min-h-20"
            placeholder="Primeira mensagem do cliente, se já tiver."
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
          <Button type="submit" disabled={busy || !name.trim() || !handle.trim()}>
            {busy ? "Criando…" : "Adicionar na caixa"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
