import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-10 shrink-0 items-center rounded-full bg-secondary shadow-[var(--shadow-border)]",
        "transition-colors duration-[var(--motion-quick)] data-[state=checked]:bg-klein",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-card transition-transform duration-[var(--motion-quick)]",
          "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
          "data-[state=checked]:bg-klein-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
