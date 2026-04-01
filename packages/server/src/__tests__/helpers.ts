import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { io as ioClient, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@os-drafter/shared";
import { registerRoomHandlers } from "../handlers/roomHandlers.js";
import { registerDraftHandlers } from "../handlers/draftHandlers.js";
import { registerRoomRoutes } from "../routes/roomRoutes.js";
import type { TypedServer } from "../types.js";

export type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface TestServer {
  app: ReturnType<typeof Fastify>;
  io: TypedServer;
  port: number;
  url: string;
  close: () => Promise<void>;
}

/**
 * Boots a real Fastify + Socket.IO server on a random port for testing.
 * Uses permissive CORS so Node.js test clients can connect without issues.
 */
export async function createTestServer(): Promise<TestServer> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });

  const clientOrigin = "http://localhost:3000";
  registerRoomRoutes(app, clientOrigin);

  app.get("/health", async () => ({ status: "ok" }));

  await app.listen({ port: 0 });

  const address = app.server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const url = `http://localhost:${port}`;

  // Create Socket.IO with permissive CORS for test clients
  const io: TypedServer = new Server(app.server, {
    cors: { origin: true },
  });

  io.on("connection", (socket) => {
    socket.data.roomId = null;
    socket.data.role = null;
    registerRoomHandlers(io, socket);
    registerDraftHandlers(io, socket);
  });

  return {
    app,
    io,
    port,
    url,
    close: async () => {
      io.close();
      await app.close();
    },
  };
}

/**
 * Creates a typed Socket.IO test client connected to the given URL.
 */
export function createTestClient(url: string): TestSocket {
  return ioClient(url, {
    autoConnect: true,
    transports: ["websocket", "polling"],
    forceNew: true,
  }) as TestSocket;
}

/**
 * Waits for a specific event on a socket. Rejects after timeout.
 */
export function waitForEvent<E extends keyof ServerToClientEvents>(
  socket: TestSocket,
  event: E,
  timeout = 5000,
): Promise<Parameters<ServerToClientEvents[E]>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for event "${event}"`));
    }, timeout);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).once(event, (...args: unknown[]) => {
      clearTimeout(timer);
      resolve(args as Parameters<ServerToClientEvents[E]>);
    });
  });
}

/**
 * Waits for the socket to connect.
 */
export function waitForConnect(socket: TestSocket, timeout = 5000): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for socket connect"));
    }, timeout);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * Waits for a socket to disconnect.
 */
export function waitForDisconnect(socket: TestSocket, timeout = 5000): Promise<void> {
  if (socket.disconnected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for socket disconnect"));
    }, timeout);
    socket.once("disconnect", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

/**
 * Small delay helper for tests that need to yield the event loop.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
