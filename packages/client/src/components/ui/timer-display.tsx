"use client";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  maxSeconds?: number;
  className?: string;
}

export function TimerDisplay({ seconds, maxSeconds, className }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${mins}:${String(secs).padStart(2, "0")}`;
  const isLow = seconds <= 10 && seconds > 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "text-4xl font-mono font-bold tabular-nums tracking-wider",
          isLow ? "text-team-red animate-pulse" : "text-foreground",
          className,
        )}
      >
        {display}
      </div>
      {maxSeconds != null && maxSeconds > 0 && (
        <div className="mt-1.5 h-[3px] w-32 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isLow ? "bg-team-red" : "bg-primary",
            )}
            style={{ width: `${(seconds / maxSeconds) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
