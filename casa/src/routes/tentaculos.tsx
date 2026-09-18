import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shield } from "lucide-react";
import { PlusMarks } from "@/components/plus-marks";
import { BrasilguardLockup } from "@/components/polvo-mark";
import { Button } from "@/components/ui/button";
import { TENTACLES } from "@/lib/polvo/catalog";

export const Route = createFileRoute("/tentaculos")({ component: Tentaculos });

function Tentaculos() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
      <header className="relative px-2 py-6 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">Linhas</p>
        <h1 className="text-display mt-4 max-w-3xl">
          <span className="word-stagger">
            <span>Um</span>
            <span>nome.</span>
          </span>
          <br />
          <span className="word-stagger word-stagger-d2 text-klein">
            <span>BrasilGuarD.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          A corretora está no ar. Segurança eletrônica entra quando o MVP vender.
        </p>
      </header>

      <div className="stagger-in grid gap-4">
        {TENTACLES.map((t) => (
          <article key={t.id} className="relative rounded-2xl bg-card p-6 md:p-8 shadow-[var(--shadow-border)]">
            <PlusMarks />
            <p className="kicker text-subtle">{t.kicker}</p>
            {t.id === "brasilguard" ? (
              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                <BrasilguardLockup className="text-4xl" />
              </h2>
            ) : (
              <h2 className="mt-4 flex items-center gap-3 text-4xl font-semibold tracking-tight">
                <Shield className="size-7 text-klein" />
                {t.name}
              </h2>
            )}
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">{t.blurb}</p>
            {t.live ? (
              <div className="mt-8 flex flex-wrap gap-2">
                <Button asChild size="pill">
                  <Link to="/brasilguard">
                    Abrir agentes
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="pill">
                  <Link to="/inbox">Caixa</Link>
                </Button>
              </div>
            ) : (
              <p className="mt-8 kicker text-subtle">Em breve · CRM, ERP, alarme e câmera.</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
