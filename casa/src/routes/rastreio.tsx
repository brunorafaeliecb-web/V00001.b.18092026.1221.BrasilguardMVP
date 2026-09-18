import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PaperBody } from "@/components/paper-body";
import { PlusMarks } from "@/components/plus-marks";
import { currentByNome, historyOf, paperById, PAPERS } from "@/lib/rastreio/catalog";
import { RELEASE_ID } from "@/lib/rastreio/parse";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rastreio")({ component: RastreioPage });

function RastreioPage() {
  const currents = useMemo(() => currentByNome(), []);
  const [id, setId] = useState(RELEASE_ID);
  const paper = paperById(id) ?? paperById(RELEASE_ID);
  const history = paper ? historyOf(paper.nome) : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8">
      <header className="relative px-2 py-4 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">Rastreio · imutável</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Papéis</h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted">
          Nenhum papel se edita. Nenhum se apaga. Mudou de ideia, nasce outro — sobe a letra ou a
          versão. O vigente é o de maior marco.
        </p>
        <p className="mt-3 font-mono text-xs text-subtle">{RELEASE_ID}</p>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-1">
          {currents.map((p) => (
            <button
              key={p.nome}
              type="button"
              onClick={() => setId(p.id)}
              className={cn(
                "rounded-2xl px-4 py-3 text-left pressable",
                paper?.nome === p.nome ? "bg-secondary" : "hover:bg-card",
              )}
            >
              <span className="block text-sm font-medium">{p.nome}</span>
              <span className="kicker text-subtle">
                V.{p.versao}.{p.letra}
              </span>
            </button>
          ))}
          <p className="mt-4 px-1 kicker text-subtle">{PAPERS.length} papéis no cofre</p>
        </aside>

        {paper ? (
          <article className="rounded-2xl bg-card p-6 shadow-[var(--shadow-border)] md:p-8">
            <p className="font-mono text-[11px] leading-relaxed break-all text-subtle">{paper.id}</p>
            <div className="mt-6">
              <PaperBody text={paper.body} />
            </div>
            {history.length > 1 ? (
              <div className="mt-10 border-t border-border pt-6">
                <p className="kicker text-muted">História deste nome</p>
                <ul className="mt-3 space-y-2">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className={cn(
                          "font-mono text-[11px] pressable",
                          h.id === paper.id ? "text-klein" : "text-subtle hover:text-foreground",
                        )}
                        onClick={() => setId(h.id)}
                      >
                        {h.id}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ) : null}
      </div>
    </div>
  );
}
