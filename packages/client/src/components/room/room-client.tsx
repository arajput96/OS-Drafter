"use client";

import { useRef } from "react";
import type { RoomRole } from "@os-drafter/shared";
import { useSocket } from "@/hooks/use-socket";
import { useDraftStore } from "@/store/draft-store";
import { ErrorToast } from "@/components/ui/error-toast";
import { WaitingRoom } from "./waiting-room";
import { DraftBoard } from "@/components/draft/draft-board";

interface RoomClientProps {
  roomId: string;
  role: RoomRole;
}

export function RoomClient({ roomId, role }: RoomClientProps) {
  const { startDraft, banMap, pickMap, selectCharacter, lockIn } =
    useSocket(roomId, role);

  const connected = useDraftStore((s) => s.connected);
  const room = useDraftStore((s) => s.room);
  const draft = useDraftStore((s) => s.draft);
  const timerRemaining = useDraftStore((s) => s.timerRemaining);
  const selectedId = useDraftStore((s) => s.selectedId);

  // Track if we were ever connected (to distinguish initial load vs reconnecting)
  const wasConnected = useRef(false);
  if (connected) wasConnected.current = true;

  const myTeam = role === "spectator" ? null : role;

  // Loading / reconnecting state
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

  // Waiting for draft to start
  if (!draft || draft.phase === "WAITING") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <WaitingRoom room={room} role={role} onStart={startDraft} />
        <ErrorToast />
      </main>
    );
  }

  // Active draft or complete
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
      />
      <ErrorToast />
    </main>
  );
}
