import { cn } from "@/lib/utils";

export function PlusMarks({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <i className="plus-mark plus-tl" />
      <i className="plus-mark plus-tr" />
      <i className="plus-mark plus-bl" />
      <i className="plus-mark plus-br" />
    </span>
  );
}
