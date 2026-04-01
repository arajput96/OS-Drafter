"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomRole,
} from "@os-drafter/shared";
import { SERVER_PORT } from "@os-drafter/shared";
import { useDraftStore } from "@/store/draft-store";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(roomId: string, role: RoomRole) {
  const socketRef = useRef<TypedSocket | null>(null);
  const { setConnected, setRole, setRoom, setDraft, setTimer, setError, reset } =
    useDraftStore();

  useEffect(() => {
    setRole(role);

    const socket: TypedSocket = io(`http://localhost:${SERVER_PORT}`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("room:join", roomId, role);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("room:state", (state) => {
      setRoom(state);
    });

    socket.on("draft:state", (state) => {
      setDraft(state);
    });

    socket.on("draft:timer", (remaining) => {
      setTimer(remaining);
    });

    socket.on("error", (message) => {
      setError(message);
    });

    return () => {
      socket.disconnect();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role]);

  const startDraft = useCallback(() => {
    socketRef.current?.emit("draft:start");
  }, []);

  const banMap = useCallback((mapId: string) => {
    socketRef.current?.emit("draft:ban-map", mapId);
  }, []);

  const pickAwakening = useCallback((awakeningId: string) => {
    socketRef.current?.emit("draft:pick-awakening", awakeningId);
  }, []);

  const selectCharacter = useCallback((characterId: string) => {
    useDraftStore.getState().setSelected(characterId);
    socketRef.current?.emit("draft:select", characterId);
  }, []);

  const lockIn = useCallback(() => {
    socketRef.current?.emit("draft:lock");
    useDraftStore.getState().setSelected(null);
  }, []);

  return { startDraft, banMap, pickAwakening, selectCharacter, lockIn };
}
