import type { Team, DraftAction } from "@os-drafter/shared";
import type { TypedServer, TypedSocket } from "../types.js";
import { registry } from "../RoomRegistry.js";
import type { Room } from "../Room.js";

export function registerDraftHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on("draft:start", () => {
    const ctx = getContext(socket);
    if (!ctx) return;
    const { room, role } = ctx;

    if (role !== "blue" && role !== "red") {
      socket.emit("error", "Only team members can start the draft");
      return;
    }

    if (!room.isBlueConnected() || !room.isRedConnected()) {
      socket.emit("error", "Both teams must be connected to start the draft");
      return;
    }

    const result = room.startDraft();
    if (!result.ok) {
      socket.emit("error", result.error);
      return;
    }

    room.broadcastDraftState(io);
    room.broadcastPhaseChange(io);
    room.startTimer(io);
  });

  socket.on("draft:ban-map", (mapId: string) => {
    const ctx = getTeamContext(socket);
    if (!ctx) return;
    const { room, team } = ctx;

    const machine = room.getMachine();
    if (!machine) {
      socket.emit("error", "Draft has not started");
      return;
    }

    const prevIndex = machine.getState().turnIndex;
    const result = machine.banMap(team, mapId);

    if (!result.ok) {
      socket.emit("error", result.error);
      return;
    }

    const action: DraftAction = {
      type: "map_ban",
      team,
      mapId,
      index: prevIndex,
    };
    io.to(room.roomId).emit("draft:action", action);

    afterAction(io, room, prevIndex);
  });

  socket.on("draft:pick-map", (mapId: string) => {
    const ctx = getTeamContext(socket);
    if (!ctx) return;
    const { room, team } = ctx;

    const machine = room.getMachine();
    if (!machine) {
      socket.emit("error", "Draft has not started");
      return;
    }

    const prevIndex = machine.getState().turnIndex;
    const result = machine.pickMap(team, mapId);

    if (!result.ok) {
      socket.emit("error", result.error);
      return;
    }

    const action: DraftAction = {
      type: "map_pick",
      team,
      mapId,
      index: prevIndex,
    };
    io.to(room.roomId).emit("draft:action", action);

    afterAction(io, room, prevIndex);
  });

  socket.on("draft:select", (characterId: string) => {
    const ctx = getTeamContext(socket);
    if (!ctx) return;
    const { room, team } = ctx;

    // Store tentative selection (does NOT touch DraftMachine)
    room.setSelection(team, characterId);
  });

  socket.on("draft:lock", () => {
    const ctx = getTeamContext(socket);
    if (!ctx) return;
    const { room, team } = ctx;

    const machine = room.getMachine();
    if (!machine) {
      socket.emit("error", "Draft has not started");
      return;
    }

    const selection = room.getSelection(team);
    if (!selection) {
      socket.emit("error", "No character selected — select a character first");
      return;
    }

    const step = machine.getCurrentStep();
    if (!step) {
      socket.emit("error", "No active step");
      return;
    }

    const prevIndex = machine.getState().turnIndex;
    let result;
    let action: DraftAction;

    if (step.phase === "CHAR_BAN") {
      result = machine.banCharacter(team, selection);
      action = { type: "ban", team, characterId: selection, index: prevIndex };
    } else if (step.phase === "CHAR_PICK") {
      result = machine.pickCharacter(team, selection);
      action = { type: "pick", team, characterId: selection, index: prevIndex };
    } else {
      socket.emit("error", `Lock is not valid during ${step.phase} phase`);
      return;
    }

    if (!result.ok) {
      socket.emit("error", result.error);
      return;
    }

    room.setSelection(team, null);
    io.to(room.roomId).emit("draft:action", action);

    afterAction(io, room, prevIndex);
  });
}

// ── Helpers ──

function getContext(socket: TypedSocket) {
  const roomId = socket.data.roomId;
  if (!roomId) {
    socket.emit("error", "Not in a room");
    return null;
  }

  const room = registry.get(roomId);
  if (!room) {
    socket.emit("error", "Room not found");
    return null;
  }

  return { room, role: socket.data.role };
}

function getTeamContext(socket: TypedSocket): { room: Room; team: Team } | null {
  const ctx = getContext(socket);
  if (!ctx) return null;

  const { role } = ctx;
  if (role !== "blue" && role !== "red") {
    socket.emit("error", "Spectators cannot perform draft actions");
    return null;
  }

  return { room: ctx.room, team: role };
}

/**
 * Common post-action logic: broadcast state, handle phase/timer changes.
 */
function afterAction(io: TypedServer, room: Room, prevIndex: number): void {
  const machine = room.getMachine();
  if (!machine) return;

  room.broadcastDraftState(io);

  const currentIndex = machine.getState().turnIndex;

  // Step advanced — clear selections, handle timer and phase change
  if (currentIndex !== prevIndex) {
    room.clearSelections();

    if (machine.isComplete()) {
      room.stopTimer();
      room.broadcastPhaseChange(io);
    } else {
      // Check if phase changed
      const prevPhase = machine.getState().turnOrder[prevIndex]?.phase;
      const currentPhase = machine.getState().phase;
      if (prevPhase !== currentPhase) {
        room.broadcastPhaseChange(io);
      }
      room.startTimer(io);
    }
  }
}
