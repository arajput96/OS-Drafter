"use client";

import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useDraftStore } from "@/store/draft-store";
import { MapDraftOverlay } from "./map-draft-overlay";
import { CharacterDraftOverlay } from "./character-draft-overlay";

interface OverlayClientProps {
  roomId: string;
  darkBg?: boolean;
}

export function OverlayClient({ roomId, darkBg }: OverlayClientProps) {
  useSocket(roomId, "spectator");

  // Add overlay class to body so CSS can override root layout styles
  useEffect(() => {
    document.body.classList.add("overlay-active");
    return () => {
      document.body.classList.remove("overlay-active");
    };
  }, []);

  const connected = useDraftStore((s) => s.connected);
  const room = useDraftStore((s) => s.room);
  const draft = useDraftStore((s) => s.draft);

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
      ) : (
        <CharacterDraftOverlay draft={draft} room={room} />
      )}
    </div>
  );
}
