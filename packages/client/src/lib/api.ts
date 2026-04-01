import type { DraftConfig, RoomState } from "@os-drafter/shared";
import { SERVER_PORT } from "@os-drafter/shared";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || `http://localhost:${SERVER_PORT}`;

export interface CreateRoomResponse {
  roomId: string;
  blueUrl: string;
  redUrl: string;
  spectatorUrl: string;
}

export async function createRoom(config: DraftConfig): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Failed to create room (${res.status})`);
  }

  return res.json();
}

export async function getRoomState(roomId: string): Promise<RoomState> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Room not found (${res.status})`);
  }

  return res.json();
}
