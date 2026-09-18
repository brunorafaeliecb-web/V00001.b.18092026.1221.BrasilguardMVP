import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  className,
  children,
  title,
}: {
  className?: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/20" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4",
          className,
        )}
      >
        <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <DialogPrimitive.Title className="text-xl font-medium tracking-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-full p-2 text-muted hover:bg-secondary hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </div>
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
