import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;

export function SheetContent({
  className,
  children,
  title,
  side = "right",
  id,
}: {
  className?: string;
  children: ReactNode;
  title: string;
  side?: "right" | "bottom" | "full";
  id?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-40",
          side === "full" ? "bg-background" : "bg-foreground/20",
        )}
      />
      <DialogPrimitive.Content
        id={id}
        className={cn(
          "fixed z-40",
          side === "right" && "inset-y-0 right-0 flex h-full w-full max-w-sm flex-col bg-card p-5 shadow-[var(--shadow-border)]",
          side === "bottom" && "inset-x-0 bottom-0 max-h-dvh rounded-t-2xl bg-card p-5 shadow-[var(--shadow-border)]",
          side === "full" &&
            "inset-0 flex h-full w-full flex-col bg-background px-4 pt-24 pb-10 md:px-10 md:pt-28",
          className,
        )}
      >
        {side === "full" ? (
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        ) : (
          <div className="mb-4 flex items-start justify-between gap-3">
            <DialogPrimitive.Title className="text-xl font-medium tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-full p-2 text-muted hover:bg-secondary hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
