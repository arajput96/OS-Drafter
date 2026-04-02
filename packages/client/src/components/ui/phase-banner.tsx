import type { DraftPhase } from "@os-drafter/shared";
import { cn } from "@/lib/utils";

const PHASE_LABELS: Record<DraftPhase, string> = {
  WAITING: "Waiting to Start",
  MAP_BAN: "Map Ban Phase",
  CHAR_BAN: "Character Ban Phase",
  CHAR_PICK: "Character Pick Phase",
  COMPLETE: "Draft Complete",
};

interface PhaseBannerProps {
  phase: DraftPhase;
  className?: string;
}

export function PhaseBanner({ phase, className }: PhaseBannerProps) {
  return (
    <h2
      className={cn(
        "text-center text-lg font-semibold uppercase tracking-widest text-primary",
        className,
      )}
    >
      {PHASE_LABELS[phase]}
    </h2>
  );
}
