"use client";

import Image from "next/image";
import { AWAKENINGS } from "@os-drafter/shared";

const awakeningMap = new Map(AWAKENINGS.map((a) => [a.id, a]));

interface AwakeningDisplayProps {
  awakeningIds: [string, string];
}

/**
 * Compact display of the 2 shared starting awakenings.
 * Used in the waiting room and during the character draft.
 */
export function AwakeningDisplay({ awakeningIds }: AwakeningDisplayProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="text-xs font-medium text-muted-foreground">
        Starting Awakenings:
      </span>
      <div className="flex gap-3">
        {awakeningIds.map((id) => {
          const awakening = awakeningMap.get(id);
          if (!awakening) return null;
          return (
            <div key={id} className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2 py-1">
              <div className="relative size-6 overflow-hidden rounded">
                <Image
                  src={awakening.icon}
                  alt={awakening.name}
                  fill
                  sizes="24px"
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
