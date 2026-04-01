import { Server } from "socket.io";
import type { TypedServer } from "./types.js";
import { registerRoomHandlers } from "./handlers/roomHandlers.js";
import { registerDraftHandlers } from "./handlers/draftHandlers.js";
import type http from "node:http";

export function createSocketServer(
  httpServer: http.Server,
  clientOrigin: string,
): TypedServer {
  const io: TypedServer = new Server(httpServer, {
    cors: {
      origin: [clientOrigin],
    },
  });

  io.on("connection", (socket) => {
    socket.data.roomId = null;
    socket.data.role = null;

    registerRoomHandlers(io, socket);
    registerDraftHandlers(io, socket);
  });

  return io;
}
