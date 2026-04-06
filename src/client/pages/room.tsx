import { useRef } from "react";
import type { RoomRole } from "@shared/types";
import { usePartySocket } from "@/hooks/use-party-socket";
import { useDraftStore } from "@/store/draft-store";
import { ErrorToast } from "@/components/ui/error-toast";
import { WaitingRoom } from "@/components/room/waiting-room";
import { DraftBoard } from "@/components/draft/draft-board";

interface RoomProps {
  id: string;
  role: RoomRole;
}

export function Room({ id, role }: RoomProps) {
  const { startDraft, banMap, pickMap, selectCharacter, lockIn, skipBan } =
    usePartySocket(id, role);

  const connected = useDraftStore((s) => s.connected);
  const room = useDraftStore((s) => s.room);
  const draft = useDraftStore((s) => s.draft);
  const timerRemaining = useDraftStore((s) => s.timerRemaining);
  const selectedId = useDraftStore((s) => s.selectedId);

  const wasConnected = useRef(false);
  if (connected) wasConnected.current = true;

  const myTeam = role === "spectator" ? null : role;

  if (!connected || !room) {
    const isReconnecting = wasConnected.current;
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {isReconnecting ? "Connection lost. Reconnecting..." : "Connecting to room..."}
          </p>
        </div>
        <ErrorToast />
      </div>
    );
  }

  if (!draft || draft.phase === "WAITING") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <WaitingRoom room={room} role={role} onStart={startDraft} />
        <ErrorToast />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 lg:p-6">
      <DraftBoard
        draft={draft}
        room={room}
        myTeam={myTeam}
        timerRemaining={timerRemaining}
        selectedId={selectedId}
        onBanMap={myTeam ? banMap : undefined}
        onPickMap={myTeam ? pickMap : undefined}
        onSelectCharacter={myTeam ? selectCharacter : undefined}
        onLockIn={myTeam ? lockIn : undefined}
        onSkipBan={myTeam ? skipBan : undefined}
      />
      <ErrorToast />
    </main>
  );
}
