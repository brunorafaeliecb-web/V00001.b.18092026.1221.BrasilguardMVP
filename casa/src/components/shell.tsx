import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { BrasilguardLockup } from "@/components/polvo-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { canAdmin, canManageTeam, ROLE_LABEL } from "@/lib/polvo/catalog";
import { usePolvoSession } from "@/lib/polvo/session";
import type { Role } from "@/lib/polvo/types";
import { PROVIDERS, PROVIDER_ORDER } from "@/lib/quatro/catalog";
import { useQuatroStore } from "@/lib/quatro/store";
import type { AgentId } from "@/lib/quatro/types";
import { cn } from "@/lib/utils";

type NavItem =
  | { kind: "home"; label: string; to: "/" }
  | {
      kind: "path";
      label: string;
      to:
        | "/inbox"
        | "/crm"
        | "/rastreio"
        | "/tentaculos"
        | "/equipe"
        | "/admin"
        | "/canais"
        | "/sala"
        | "/provedores"
        | "/brasilguard";
    }
  | { kind: "agent"; id: AgentId; label: string };

const AGENT_NAV: { id: AgentId; label: string }[] = [
  { id: "ana", label: "Ana" },
  { id: "carla", label: "Carla" },
  { id: "catia", label: "Cátia" },
  { id: "taiz", label: "Taiz" },
  { id: "simone", label: "Simone" },
];

function inTentacle(pathname: string) {
  return (
    pathname.startsWith("/brasilguard") ||
    pathname.startsWith("/agente") ||
    pathname === "/sala" ||
    pathname === "/provedores"
  );
}

function navActive(pathname: string, item: NavItem) {
  if (item.kind === "home") return pathname === "/";
  if (item.kind === "agent") return pathname === `/agente/${item.id}`;
  if (item.to === "/inbox") return pathname.startsWith("/inbox");
  if (item.to === "/crm") return pathname.startsWith("/crm");
  if (item.to === "/brasilguard") return inTentacle(pathname) && item.kind === "path";
  return pathname === item.to;
}

function NavLink({
  item,
  className,
  onNavigate,
}: {
  item: NavItem;
  className: string;
  onNavigate?: () => void;
}) {
  if (item.kind === "agent") {
    return (
      <Link to="/agente/$id" params={{ id: item.id }} className={className} onClick={onNavigate}>
        {item.label}
      </Link>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

function HeaderSkeleton() {
  return (
    <header className="chrome-enter fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-background px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 md:px-12">
      <div className="flex min-h-11 items-center gap-2.5">
        <span className="size-5 rounded-full bg-secondary shimmer" />
        <span className="h-4 w-16 rounded-full bg-secondary shimmer" />
      </div>
      <div className="hidden items-center gap-6 lg:flex">
        <span className="h-3 w-14 rounded-full bg-secondary shimmer" />
        <span className="h-3 w-20 rounded-full bg-secondary shimmer" />
        <span className="h-3 w-12 rounded-full bg-secondary shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <span className="size-8 rounded-full bg-secondary shimmer" />
        <span className="h-11 w-20 rounded-full bg-secondary shimmer" />
      </div>
    </header>
  );
}

function HeaderBar({
  pathname,
  role,
  orgName,
  menu,
  setMenu,
}: {
  pathname: string;
  role: Role | null;
  orgName: string | null;
  menu: boolean;
  setMenu: (v: boolean) => void;
}) {
  const tentacle = inTentacle(pathname);
  const desktop: NavItem[] = [
    { kind: "path", label: "Mensagens", to: "/inbox" },
    { kind: "path", label: "CRM", to: "/crm" },
    { kind: "path", label: "Rastreio", to: "/rastreio" },
    { kind: "path", label: "Agentes", to: "/brasilguard" },
  ];
  if (role && canManageTeam(role)) desktop.push({ kind: "path", label: "Equipe", to: "/equipe" });
  if (role && canAdmin(role)) desktop.push({ kind: "path", label: "Admin", to: "/admin" });
  if (tentacle) {
    for (const a of AGENT_NAV) desktop.push({ kind: "agent", id: a.id, label: a.label });
  }

  return (
    <header className="chrome-enter fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-border bg-background px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 md:px-12">
      <Link to="/" className="flex min-h-11 items-center gap-2.5 pressable" aria-label="BrasilGuarD">
        <BrasilguardLockup />
      </Link>
      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-x-auto xl:gap-6 lg:flex">
        {desktop.map((item) => (
          <NavLink
            key={item.kind === "agent" ? item.id : item.to}
            item={item}
            className={cn(
              "nav-link kicker pressable whitespace-nowrap",
              navActive(pathname, item) ? "nav-link-active text-foreground" : "text-muted hover:text-foreground",
            )}
          />
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {role ? (
          <span className="kicker hidden text-subtle md:inline">
            {ROLE_LABEL[role]}
            {orgName ? ` · ${orgName}` : ""}
          </span>
        ) : null}
        {tentacle ? (
          <Button asChild size="pill" className="hidden sm:inline-flex">
            <Link to="/sala">Sala</Link>
          </Button>
        ) : null}
        <div className="max-w-[40vw] truncate text-sm md:max-w-none">
          <UserButton />
        </div>
        <Button
          type="button"
          variant="outline"
          size="pill"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="hub-menu"
        >
          {menu ? "Fechar" : "Menu"}
        </Button>
      </div>
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const { session, error } = usePolvoSession();
  const workspaceName = useQuatroStore((s) => s.workspaceName);
  const providers = useQuatroStore((s) => s.providers);
  const [menu, setMenu] = useState(false);
  const isLogin = pathname === "/login";

  useEffect(() => {
    void Promise.resolve(useQuatroStore.persist.rehydrate()).then(() => {
      useQuatroStore.getState().setHydrated();
    });
  }, []);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  const role = session?.member.role ?? null;
  const overlay: NavItem[] = [
    { kind: "home", label: "Início", to: "/" },
    { kind: "path", label: "Mensagens", to: "/inbox" },
    { kind: "path", label: "CRM", to: "/crm" },
    { kind: "path", label: "Rastreio", to: "/rastreio" },
    { kind: "path", label: "Agentes", to: "/brasilguard" },
    { kind: "path", label: "Canais", to: "/canais" },
  ];
  if (role && canManageTeam(role)) overlay.push({ kind: "path", label: "Equipe", to: "/equipe" });
  if (role && canAdmin(role)) overlay.push({ kind: "path", label: "Admin", to: "/admin" });
  for (const a of AGENT_NAV) overlay.push({ kind: "agent", id: a.id, label: a.label });
  overlay.push({ kind: "path", label: "Sala", to: "/sala" });
  overlay.push({ kind: "path", label: "Acoplamento", to: "/provedores" });

  const chrome = (body: ReactNode, header: ReactNode) => (
    <TooltipProvider>
      <div className="min-h-dvh bg-background text-foreground">
        {header}
        <main className="flex min-h-dvh flex-col px-5 pt-28 pb-16 md:px-12 md:pt-32 md:pb-24">
          {body}
        </main>
        {session ? (
          <Sheet open={menu} onOpenChange={setMenu} modal={false}>
            <SheetContent title="Menu" side="full" id="hub-menu">
              <p className="kicker text-muted">{session.org.name}</p>
              <nav className="stagger-in mt-10 flex flex-1 flex-col justify-center gap-1">
                {overlay.map((item) => (
                  <NavLink
                    key={item.kind === "agent" ? item.id : item.to}
                    item={item}
                    onNavigate={() => setMenu(false)}
                    className={cn(
                      "py-1 text-3xl leading-none font-semibold tracking-tight md:text-5xl pressable",
                      navActive(pathname, item) ? "text-klein" : "text-foreground hover:text-klein",
                    )}
                  />
                ))}
              </nav>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <BrasilguardLockup className="text-muted" />
                {PROVIDER_ORDER.map((id) => {
                  const p = providers[id];
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span
                        className={cn("size-1.5 rounded-full", p.coupled ? "bg-klein" : "bg-subtle")}
                        aria-hidden
                      />
                      <span className="kicker text-muted">{PROVIDERS[id].short}</span>
                      <span className="kicker text-muted tabular-nums">
                        {p.coupled ? (p.mode === "api" ? "API" : "web") : "solto"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 kicker text-subtle">{workspaceName}</p>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
      <Toaster
        theme="light"
        position="top-center"
        toastOptions={{
          className: "!bg-card !text-foreground !border-border !shadow-none !rounded-full",
        }}
      />
    </TooltipProvider>
  );

  if (isLogin) {
    return (
      <TooltipProvider>
        {children}
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            className: "!bg-card !text-foreground !border-border !shadow-none !rounded-full",
          }}
        />
      </TooltipProvider>
    );
  }

  if (isPending) {
    return chrome(children, <HeaderSkeleton />);
  }

  if (!user) {
    return (
      <TooltipProvider>
        <RedirectToSignIn />
        <Toaster
          theme="light"
          position="top-center"
          toastOptions={{
            className: "!bg-card !text-foreground !border-border !shadow-none !rounded-full",
          }}
        />
      </TooltipProvider>
    );
  }

  if (error && !session) {
    return chrome(
      <div className="mx-auto flex max-w-lg flex-col gap-6 py-16">
        <p className="kicker text-muted">Acesso fechado</p>
        <h1 className="text-4xl font-semibold tracking-tight">Sem convite, sem entrada.</h1>
        <p className="text-base leading-relaxed text-muted">{error}</p>
      </div>,
      <HeaderBar pathname={pathname} role={null} orgName={null} menu={menu} setMenu={setMenu} />,
    );
  }

  return chrome(
    children,
    <HeaderBar
      pathname={pathname}
      role={role}
      orgName={session?.org.name ?? null}
      menu={menu}
      setMenu={setMenu}
    />,
  );
}
