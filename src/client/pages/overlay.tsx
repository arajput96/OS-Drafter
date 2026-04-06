import { useEffect } from "react";
import { usePartySocket } from "@/hooks/use-party-socket";
import { useDraftStore } from "@/store/draft-store";
import { MapDraftOverlay } from "@/components/overlay/map-draft-overlay";
import { CharacterDraftOverlay } from "@/components/overlay/character-draft-overlay";

interface OverlayProps {
  id: string;
  darkBg: boolean;
}

export function Overlay({ id, darkBg }: OverlayProps) {
  usePartySocket(id, "spectator");

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
      <div className="overlay-root">
        <div className={`overlay-banner ${darkBg ? "bg-[#111]" : ""}`}>
          <p className="text-sm text-white/50 animate-pulse">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!draft || draft.phase === "WAITING") {
    return (
      <div className="overlay-root">
        <div className={`overlay-banner ${darkBg ? "bg-[#111]" : ""}`}>
          <p className="text-sm text-white/50 animate-pulse">
            Waiting for draft to start...
          </p>
        </div>
      </div>
    );
  }

  const isMapDraft = room.config.draftType === "map";

  return (
    <div className="overlay-root">
      <div className={`overlay-banner ${darkBg ? "bg-[#111]" : ""}`}>
        {isMapDraft ? (
          <MapDraftOverlay draft={draft} room={room} />
        ) : (
          <CharacterDraftOverlay draft={draft} room={room} />
        )}
      </div>
    </div>
  );
}
