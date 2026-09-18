import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign, Instagram, MessageCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { PlusMarks } from "@/components/plus-marks";
import { CHANNEL_ORDER, CHANNELS } from "@/lib/polvo/catalog";
import { listChannels } from "@/lib/polvo/server";
import type { ChannelAccount, ChannelId } from "@/lib/polvo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/canais")({ component: Canais });

const ICONS: Record<ChannelId, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Instagram,
  messenger: MessageCircle,
  direct: AtSign,
};

function Canais() {
  const [accounts, setAccounts] = useState<ChannelAccount[] | null>(null);

  useEffect(() => {
    listChannels()
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, []);

  const byId = new Map((accounts ?? []).map((a) => [a.channel, a]));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
      <header className="relative px-2 py-6 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">Canais</p>
        <h1 className="text-display mt-4 max-w-3xl">
          <span className="word-stagger">
            <span>Uma</span>
            <span>caixa.</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d2 text-klein">
            <span>Cinco</span>
            <span>fios.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          WhatsApp é o CRM. Os outros entram na mesma ficha, sem fila paralela.
        </p>
      </header>

      <div className="stagger-in grid gap-4 md:grid-cols-2">
        {CHANNEL_ORDER.map((id) => {
          const meta = CHANNELS[id];
          const acc = byId.get(id);
          const Icon = ICONS[id];
          const live = meta.live;
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-secondary">
                  <Icon className="size-4" />
                </span>
                <span className={cn("kicker", live ? "text-klein" : "text-subtle")}>
                  {live ? "ao vivo" : "em acoplamento"}
                </span>
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">{meta.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{meta.blurb}</p>
              <p className="mt-6 kicker text-subtle">{acc?.label ?? meta.short}</p>
              {!live ? (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  Canal desenhado, ainda sem fio. Quando acoplar, a caixa é a mesma.
                </p>
              ) : null}
            </>
          );
          if (live) {
            return (
              <Link
                key={id}
                to="/inbox"
                className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)] pressable hover:shadow-[var(--shadow-border-hover)]"
              >
                {inner}
              </Link>
            );
          }
          return (
            <article key={id} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)]">
              {inner}
            </article>
          );
        })}
      </div>
    </div>
  );
}
