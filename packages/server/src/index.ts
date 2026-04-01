import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { APP_NAME, SERVER_PORT, CLIENT_PORT } from "@os-drafter/shared";

const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: [CLIENT_ORIGIN],
});

const io = new Server(fastify.server, {
  cors: {
    origin: [CLIENT_ORIGIN],
  },
});

io.on("connection", (socket) => {
  fastify.log.info(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    fastify.log.info(`Client disconnected: ${socket.id}`);
  });
});

fastify.get("/health", async () => {
  return { status: "ok", app: APP_NAME };
});

try {
  await fastify.listen({ port: SERVER_PORT, host: "0.0.0.0" });
  fastify.log.info(`${APP_NAME} server running on port ${SERVER_PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
