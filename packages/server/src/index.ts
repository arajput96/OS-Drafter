import Fastify from "fastify";
import cors from "@fastify/cors";
import { APP_NAME, SERVER_PORT, CLIENT_PORT } from "@os-drafter/shared";
import { createSocketServer } from "./socketSetup.js";
import { registerRoomRoutes } from "./routes/roomRoutes.js";

const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: [CLIENT_ORIGIN],
});

// REST routes
fastify.get("/health", async () => {
  return { status: "ok", app: APP_NAME };
});

registerRoomRoutes(fastify, CLIENT_ORIGIN);

// Start server, then attach Socket.IO
await fastify.listen({ port: SERVER_PORT, host: "0.0.0.0" });
fastify.log.info(`${APP_NAME} server running on port ${SERVER_PORT}`);

// Socket.IO attaches to the underlying http.Server
createSocketServer(fastify.server, CLIENT_ORIGIN);
