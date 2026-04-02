"use client";

import type { RoomState, RoomRole } from "@os-drafter/shared";
import { Button } from "@/components/ui/button";
import { Check, Copy, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDraftStore } from "@/store/draft-store";

interface WaitingRoomProps {
  room: RoomState;
  role: RoomRole;
  onStart: () => void;
}

export function WaitingRoom({ room, role, onStart }: WaitingRoomProps) {
  const [starting, setStarting] = useState(false);
  const error = useDraftStore((s) => s.error);
  const canStart =
    role !== "spectator" && room.blueConnected && room.redConnected;

  // Reset starting state if an error occurs (e.g., server rejected the start)
  useEffect(() => {
    if (error) setStarting(false);
  }, [error]);

  const handleStart = () => {
    if (starting) return;
    setStarting(true);
    onStart();
  };

  const [baseUrl, setBaseUrl] = useState("");
  useEffect(() => {
    setBaseUrl(`${window.location.origin}/room/${room.roomId}`);
  }, [room.roomId]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <h2 className="text-center text-xl font-bold text-primary">
        Waiting for Players
      </h2>

      {/* Connection status */}
      <div className="flex flex-col gap-3">
        <ConnectionStatus
          label="Side Select"
          connected={room.blueConnected}
          colorClass="text-team-blue"
        />
        <ConnectionStatus
          label="Map Select"
          connected={room.redConnected}
          colorClass="text-team-red"
        />
        {room.spectatorCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {room.spectatorCount} spectator{room.spectatorCount !== 1 && "s"}
          </p>
        )}
      </div>

      {/* Shareable links */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Share these links
        </p>
        <CopyLink label="Side Select" url={`${baseUrl}?role=blue`} />
        <CopyLink label="Map Select" url={`${baseUrl}?role=red`} />
        <CopyLink label="Spectator" url={`${baseUrl}?role=spectator`} />
      </div>

      {/* Config summary */}
      <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
        <p>
          Format: {room.config.mapBanMode.toUpperCase()} | Bans: {room.config.numBans} | Picks:{" "}
          {room.config.numPicks} | Timer: {room.config.timerSeconds}s
        </p>
      </div>

      {/* Start button */}
      {role !== "spectator" && (
        <Button
          onClick={handleStart}
          disabled={!canStart || starting}
          size="lg"
          className="w-full"
        >
          {starting ? "Starting..." : canStart ? "Start Draft" : "Waiting for both teams..."}
        </Button>
      )}
    </div>
  );
}

function ConnectionStatus({
  label,
  connected,
  colorClass,
}: {
  label: string;
  connected: boolean;
  colorClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <Check className={`size-4 ${colorClass}`} />
      ) : (
        <X className="size-4 text-muted-foreground" />
      )}
      <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
      <span className="text-xs text-muted-foreground">
        {connected ? "Connected" : "Waiting..."}
      </span>
    </div>
  );
}

function CopyLink({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore silently — link is visible and can be copied manually
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs text-muted-foreground shrink-0">
        {label}:
      </span>
      <code className="flex-1 truncate rounded bg-secondary px-2 py-1 text-xs">
        {url}
      </code>
      <button
        onClick={handleCopy}
        aria-label={copied ? `${label} link copied` : `Copy ${label} link`}
        className="shrink-0 rounded p-1 hover:bg-secondary transition-colors"
      >
        {copied ? (
          <Check className="size-3.5 text-primary" />
        ) : (
          <Copy className="size-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
