import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomRole,
} from "@os-drafter/shared";

/** Socket.IO data attached to each connected socket */
export interface SocketData {
  roomId: string | null;
  role: RoomRole | null;
}

/** Typed Socket.IO server */
export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/** Typed Socket.IO socket */
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;
