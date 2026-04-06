import { useState, useEffect } from "react";
import type { RoomState, RoomRole } from "@shared/types";
import { Button } from "@/components/ui/button";
import { Check, Copy, X } from "lucide-react";
import { useDraftStore } from "@/store/draft-store";
import { AwakeningDisplay } from "@/components/draft/awakening-display";
import { CopyAllButton } from "./form-fields";

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

  const isCharacterDraft = room.config.draftType === "character";
  const blueLabel = isCharacterDraft ? "Blue" : "Side Select";
  const redLabel = isCharacterDraft ? "Red" : "Map Select";

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

      <div className="flex flex-col gap-3">
        <ConnectionStatus
          label={blueLabel}
          connected={room.blueConnected}
          colorClass="text-team-blue"
        />
        <ConnectionStatus
          label={redLabel}
          connected={room.redConnected}
          colorClass="text-team-red"
        />
        {room.spectatorCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {room.spectatorCount} spectator{room.spectatorCount !== 1 && "s"}
          </p>
        )}
      </div>

      {isCharacterDraft && room.config.selectedMapName && (
        <div className="rounded-lg bg-secondary/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Map</p>
          <p className="text-sm font-semibold">{room.config.selectedMapName}</p>
        </div>
      )}

      {isCharacterDraft && room.revealedAwakenings && (
        <AwakeningDisplay awakeningIds={room.revealedAwakenings} />
      )}

      <ShareLinks
        blueLabel={blueLabel}
        redLabel={redLabel}
        baseUrl={baseUrl}
      />

      <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
        {isCharacterDraft ? (
          <p>
            Bans: {room.config.numBans} | Picks: {room.config.numPicks} | Timer: {room.config.timerSeconds}s
          </p>
        ) : (
          <p>
            Format: {room.config.mapBanMode.toUpperCase()} | Timer: {room.config.timerSeconds}s
          </p>
        )}
      </div>

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

function ShareLinks({
  blueLabel,
  redLabel,
  baseUrl,
}: {
  blueLabel: string;
  redLabel: string;
  baseUrl: string;
}) {
  const blueUrl = `${baseUrl}?role=blue`;
  const redUrl = `${baseUrl}?role=red`;
  const spectatorUrl = `${baseUrl}?role=spectator`;
  const overlayUrl = `${baseUrl}/overlay`;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        Share these links
      </p>
      <CopyLink label={blueLabel} url={blueUrl} />
      <CopyLink label={redLabel} url={redUrl} />
      <CopyLink label="Spectator" url={spectatorUrl} />
      <CopyLink label="OBS Overlay" url={overlayUrl} />
      {baseUrl && (
        <CopyAllButton
          size="sm"
          links={[
            { label: blueLabel, url: blueUrl },
            { label: redLabel, url: redUrl },
            { label: "Spectator", url: spectatorUrl },
            { label: "OBS Overlay", url: overlayUrl },
          ]}
        />
      )}
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
      // ignore
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
