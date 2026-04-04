import type { RoomRole } from "@os-drafter/shared";
import type { TypedServer, TypedSocket } from "../types.js";
import { registry } from "../RoomRegistry.js";
import { validateDraftConfig } from "../validation.js";
import type { Room } from "../Room.js";

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.on("room:create", (config, callback) => {
    const error = validateDraftConfig(config);
    if (error) {
      socket.emit("error", error);
      return;
    }

    const payload = config as unknown as Record<string, unknown>;
    const blueTeamName = typeof payload.blueTeamName === "string" ? payload.blueTeamName : undefined;
    const redTeamName = typeof payload.redTeamName === "string" ? payload.redTeamName : undefined;
    const room = registry.create(config, blueTeamName, redTeamName);

    // Auto-join the creator as blue
    socket.data.roomId = room.roomId;
    socket.data.role = "blue";
    room.addSocket(socket.id, "blue");
    void socket.join(room.roomId);

    socket.emit("room:state", room.getRoomState());
    callback(room.roomId);
  });

  socket.on("room:join", (roomId: string, role: RoomRole) => {
    const room = registry.get(roomId);
    if (!room) {
      socket.emit("error", `Room "${roomId}" not found`);
      return;
    }

    // If already in a room, leave it first
    if (socket.data.roomId) {
      leaveCurrentRoom(io, socket);
    }

    // Prevent duplicate team assignments (unless reconnecting)
    if (role === "blue" && room.isBlueConnected() && !room.getRoomState().draft) {
      socket.emit("error", "Blue team is already taken");
      return;
    }
    if (role === "red" && room.isRedConnected() && !room.getRoomState().draft) {
      socket.emit("error", "Red team is already taken");
      return;
    }

    socket.data.roomId = room.roomId;
    socket.data.role = role;
    room.addSocket(socket.id, role);
    void socket.join(room.roomId);

    // Send current state to the joining socket (reconnection catch-up)
    socket.emit("room:state", room.getRoomState());
    const draftView = getDraftViewForRole(room, role);
    if (draftView) {
      socket.emit("draft:state", draftView);
      socket.emit("draft:phase-change", draftView.phase);
    }

    // Broadcast updated room state to everyone
    room.broadcastRoomState(io);
  });

  socket.on("disconnect", () => {
    leaveCurrentRoom(io, socket);
  });
}

function leaveCurrentRoom(io: TypedServer, socket: TypedSocket): void {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = registry.get(roomId);
  if (!room) return;

  room.removeSocket(socket.id);
  void socket.leave(roomId);

  socket.data.roomId = null;
  socket.data.role = null;

  // If room is completely empty, clean it up
  if (room.getTotalSockets() === 0) {
    registry.delete(roomId);
    return;
  }

  // Broadcast updated connection status
  room.broadcastRoomState(io);
}

function getDraftViewForRole(room: Room, role: RoomRole) {
  if (role === "blue") return room.getTeamDraftView("blue");
  if (role === "red") return room.getTeamDraftView("red");
  return room.getSpectatorDraftView();
}
