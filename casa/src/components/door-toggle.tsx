import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { defaultDoor, readDoor, writeDoor, type Door } from "@/lib/polvo/door";
import { usePolvoSession } from "@/lib/polvo/session";
import { cn } from "@/lib/utils";

export function useDoor() {
  const { user } = useCurrentUserState();
  const { session } = usePolvoSession();
  const role = session?.member.role ?? null;
  const [door, setDoor] = useState<Door>(() => defaultDoor(role));

  useEffect(() => {
    setDoor(readDoor(user?.id, role));
  }, [user?.id, role]);

  function choose(next: Door) {
    setDoor(next);
    if (user?.id) writeDoor(user.id, next);
  }

  return { door, choose, to: door === "crm" ? "/crm" : "/inbox" } as const;
}

export function DoorToggle({ className }: { className?: string }) {
  const { door, choose } = useDoor();
  return (
    <div className={cn("flex gap-1 rounded-full bg-secondary p-1", className)} role="group" aria-label="Porta de entrada">
      <button
        type="button"
        className={cn(
          "h-9 rounded-full px-3 text-xs font-medium tracking-widest uppercase pressable",
          door === "inbox" ? "bg-primary text-primary-foreground" : "text-muted",
        )}
        onClick={() => choose("inbox")}
      >
        Mensagens
      </button>
      <button
        type="button"
        className={cn(
          "h-9 rounded-full px-3 text-xs font-medium tracking-widest uppercase pressable",
          door === "crm" ? "bg-primary text-primary-foreground" : "text-muted",
        )}
        onClick={() => choose("crm")}
      >
        Quadro
      </button>
    </div>
  );
}
