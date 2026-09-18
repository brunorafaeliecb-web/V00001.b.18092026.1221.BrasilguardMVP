import { cn } from "@/lib/utils";

export function BrasilguardLockup({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      <span className="text-klein">B</span>
      <span>RASIL</span>
      <span className="text-klein">G</span>
      <span>UAR</span>
      <span className="text-klein">D</span>
    </span>
  );
}
