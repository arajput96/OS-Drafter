"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomRole,
} from "@os-drafter/shared";
import { SERVER_PORT, NO_BAN } from "@os-drafter/shared";
import { useDraftStore } from "@/store/draft-store";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(roomId: string, role: RoomRole) {
  const socketRef = useRef<TypedSocket | null>(null);
  useEffect(() => {
    useDraftStore.getState().setRole(role);

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_IO_URL || `http://localhost:${SERVER_PORT}`;

    const socket: TypedSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      useDraftStore.getState().setConnected(true);
      socket.emit("room:join", roomId, role);
    });

    socket.on("disconnect", () => {
      useDraftStore.getState().setConnected(false);
    });

    socket.on("room:state", (state) => {
      useDraftStore.getState().setRoom(state);
    });

    socket.on("draft:state", (state) => {
      useDraftStore.getState().setDraft(state);
    });

    socket.on("draft:timer", (remaining) => {
      useDraftStore.getState().setTimer(remaining);
    });

    socket.on("draft:tentative", ({ team, characterId }) => {
      useDraftStore.getState().setTentative(team, characterId);
    });

    socket.on("error", (message) => {
      useDraftStore.getState().setError(message);
    });

    return () => {
      socket.disconnect();
      useDraftStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role]);

  const startDraft = useCallback(() => {
    socketRef.current?.emit("draft:start");
  }, []);

  const banMap = useCallback((mapId: string) => {
    socketRef.current?.emit("draft:ban-map", mapId);
  }, []);

  const pickMap = useCallback((mapId: string) => {
    socketRef.current?.emit("draft:pick-map", mapId);
  }, []);

  const selectCharacter = useCallback((characterId: string) => {
    useDraftStore.getState().setSelected(characterId);
    socketRef.current?.emit("draft:select", characterId);
  }, []);

  const lockIn = useCallback(() => {
    socketRef.current?.emit("draft:lock");
    useDraftStore.getState().setSelected(null);
  }, []);

  const skipBan = useCallback(() => {
    useDraftStore.getState().setSelected(NO_BAN);
    socketRef.current?.emit("draft:select", NO_BAN);
    socketRef.current?.emit("draft:lock");
    useDraftStore.getState().setSelected(null);
  }, []);

  return { startDraft, banMap, pickMap, selectCharacter, lockIn, skipBan };
}
