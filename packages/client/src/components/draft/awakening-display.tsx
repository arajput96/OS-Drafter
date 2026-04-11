"use client";

import Image from "next/image";
import { AWAKENINGS } from "@os-drafter/shared";

const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface AwakeningDisplayProps {
  awakeningIds: [string, string];
  showLabel?: boolean;
  large?: boolean;
}

/**
 * Compact display of the 2 shared starting awakenings.
 * Used in the waiting room and during the character draft.
 */
export function AwakeningDisplay({ awakeningIds, showLabel = true, large = false }: AwakeningDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {showLabel && (
        <span className="text-sm font-medium text-muted-foreground">
          Starting Awakenings:
        </span>
      )}
      <div className="flex gap-3">
        {awakeningIds.map((id) => {
          const awakening = awakeningMap.get(id);
          if (!awakening) return null;
          return (
            <div key={id} className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
              <div className={large ? "relative size-[72px] overflow-hidden rounded" : "relative size-9 overflow-hidden rounded"}>
                <Image
                  src={awakening.icon}
                  alt={awakening.name}
                  fill
                  sizes={large ? "72px" : "36px"}
                  className="object-cover"
                />
              </div>
              <span className="text-xs font-medium">{awakening.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
