"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useDraftStore } from "@/store/draft-store";
import { MapDraftOverlay } from "./map-draft-overlay";
import { CharacterDraftOverlay } from "./character-draft-overlay";
import { CharacterDraftOverlayV2 } from "./character-draft-overlay-v2";

interface OverlayClientProps {
  roomId: string;
  darkBg?: boolean;
  version?: "v1" | "v2";
}

export function OverlayClient({ roomId, darkBg, version = "v2" }: OverlayClientProps) {
  useSocket(roomId, "spectator");

  // Force dark background for overlay pages — must use !important to override
  // Next.js not-found template which injects body{background:#fff} inline
  useEffect(() => {
    document.body.classList.add("overlay-active");
    document.documentElement.style.setProperty("background", "#0d0d12", "important");
    document.body.style.setProperty("background", "#0d0d12", "important");
    return () => {
      document.body.classList.remove("overlay-active");
      document.documentElement.style.removeProperty("background");
      document.body.style.removeProperty("background");
    };
  }, []);

  const connected = useDraftStore((s) => s.connected);
  const room = useDraftStore((s) => s.room);
  const draft = useDraftStore((s) => s.draft);
  const timerRemaining = useDraftStore((s) => s.timerRemaining);
  const tentative = useDraftStore((s) => s.tentative);

  if (!connected || !room) {
    return (
      <div className={`overlay-banner ${darkBg ? "bg-[#111]" : ""}`}>
        <p className="text-sm text-white/50 animate-pulse">Connecting...</p>
      </div>
    );
  }

  if (!draft || draft.phase === "WAITING") {
    return (
      <div className={`overlay-banner ${darkBg ? "bg-[#111]" : ""}`}>
        <p className="text-sm text-white/50 animate-pulse">
          Waiting for draft to start...
        </p>
      </div>
    );
  }

  const isMapDraft = room.config.draftType === "map";

  return (
    <div className={`overlay-banner ${darkBg ? "bg-[#111]" : ""}`}>
      {isMapDraft ? (
        <MapDraftOverlay draft={draft} room={room} />
      ) : version === "v2" ? (
        <CharacterDraftOverlayV2
          draft={draft}
          room={room}
          timerRemaining={timerRemaining}
          tentative={tentative}
        />
      ) : (
        <CharacterDraftOverlay draft={draft} room={room} />
      )}
    </div>
  );
}
