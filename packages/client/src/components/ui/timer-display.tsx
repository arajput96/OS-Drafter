"use client";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  className?: string;
}

export function TimerDisplay({ seconds, className }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;
  const isLow = seconds <= 10 && seconds > 0;

  return (
    <div
      className={cn(
        "text-4xl font-mono font-bold tabular-nums tracking-wider",
        isLow ? "text-team-red animate-pulse" : "text-foreground",
        className,
      )}
    >
      {display}
    </div>
  );
}
