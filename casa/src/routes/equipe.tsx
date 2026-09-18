import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PlusMarks } from "@/components/plus-marks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canAssignRole,
  canManageTeam,
  ROLE_BLURB,
  ROLE_LABEL,
} from "@/lib/polvo/catalog";
import { polvoError } from "@/lib/polvo/errors";
import {
  inviteMember,
  listInvites,
  listMembers,
  revokeInvite,
  updateMember,
} from "@/lib/polvo/server";
import { usePolvoSession } from "@/lib/polvo/session";
import type { Invite, Member, Role } from "@/lib/polvo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipe")({ component: Equipe });

function Equipe() {
  const { session, isPending, refresh } = usePolvoSession();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operator");
  const [busy, setBusy] = useState(false);

  const actor = session?.member;

  async function load() {
    if (!actor || !canManageTeam(actor.role)) return;
    try {
      const [m, i] = await Promise.all([listMembers(), listInvites()]);
      setMembers(m);
      setInvites(i);
    } catch (err) {
      toast.error(polvoError(err));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor?.id]);

  if (isPending) {
    return <div className="h-40 rounded-2xl bg-secondary shimmer" />;
  }

  if (!actor || !canManageTeam(actor.role)) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <p className="kicker text-muted">Equipe</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Papel de operador.</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Só supervisor e administrador vêem o time. Você atende a caixa.
        </p>
        <Button asChild size="pill" className="mt-8">
          <Link to="/inbox">Ir para a caixa</Link>
        </Button>
      </div>
    );
  }

  const inviteRoles: Role[] =
    actor.role === "admin" ? ["operator", "supervisor", "admin"] : ["operator"];

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await inviteMember({ data: { email: email.trim(), role } });
      setEmail("");
      toast.success("Convite enviado.");
      await load();
    } catch (err) {
      toast.error(polvoError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRole(member: Member, next: Role) {
    try {
      await updateMember({ data: { id: member.id, role: next } });
      await load();
      await refresh();
    } catch (err) {
      toast.error(polvoError(err));
    }
  }

  async function onToggle(member: Member) {
    try {
      await updateMember({
        data: { id: member.id, status: member.status === "active" ? "inactive" : "active" },
      });
      await load();
      await refresh();
    } catch (err) {
      toast.error(polvoError(err));
    }
  }

  async function onRevoke(id: string) {
    try {
      await revokeInvite({ data: { id } });
      await load();
    } catch (err) {
      toast.error(polvoError(err));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
      <header className="relative px-2 py-6 md:px-4">
        <PlusMarks />
        <p className="kicker text-muted">{session?.org.name}</p>
        <h1 className="text-display mt-4">
          <span className="word-stagger">
            <span>O</span>
            <span>time.</span>
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
          Convide por e-mail. Quem criar conta com esse endereço entra no papel combinado.
        </p>
      </header>

      <form
        onSubmit={(e) => void onInvite(e)}
        className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-[var(--shadow-border)] md:flex-row md:items-end"
      >
        <label className="flex-1">
          <span className="kicker text-muted">E-mail</span>
          <Input
            className="mt-2"
            type="email"
            required
            placeholder="fiona.g@example.net"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span className="kicker text-muted">Papel</span>
          <select
            className="mt-2 h-11 rounded-xl bg-card px-3 text-sm shadow-[var(--shadow-border)]"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {inviteRoles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Convidar"}
        </Button>
      </form>

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Membros</h2>
        <div className="flex flex-col gap-3">
          {(members ?? []).map((m) => {
            const locked = actor.role === "supervisor" && m.role !== "operator";
            const self = m.id === actor.id;
            return (
              <article
                key={m.id}
                className="flex flex-col gap-3 rounded-2xl bg-card px-5 py-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{m.displayName || m.email || "Sem nome"}</p>
                  <p className="mt-1 truncate text-sm text-muted">{m.email ?? m.userId}</p>
                  <p className={cn("mt-2 kicker", m.status === "active" ? "text-klein" : "text-subtle")}>
                    {ROLE_LABEL[m.role]} · {m.status === "active" ? "ativo" : "desativado"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-11 min-w-36 rounded-xl bg-background px-3 text-sm shadow-[var(--shadow-border)]"
                    value={m.role}
                    disabled={locked}
                    onChange={(e) => void onRole(m, e.target.value as Role)}
                  >
                    {(["operator", "supervisor", "admin"] as Role[])
                      .filter((r) => r === m.role || canAssignRole(actor.role, r))
                      .map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                  </select>
                  <Button
                    type="button"
                    variant={m.status === "active" ? "outline" : "secondary"}
                    disabled={locked || self}
                    onClick={() => void onToggle(m)}
                  >
                    {m.status === "active" ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Convites</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted">Nenhum convite ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {invites.map((inv) => (
              <article
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-5 py-4 shadow-[var(--shadow-border)]"
              >
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="mt-1 kicker text-subtle">
                    {ROLE_LABEL[inv.role]} · {inv.status}
                  </p>
                </div>
                {inv.status === "pending" ? (
                  <Button type="button" variant="ghost" onClick={() => void onRevoke(inv.id)}>
                    Revogar
                  </Button>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {(["operator", "supervisor", "admin"] as Role[]).map((r) => (
          <article key={r} className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="kicker text-muted">{ROLE_LABEL[r]}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{ROLE_BLURB[r]}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
