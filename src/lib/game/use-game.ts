"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConvexConnectionState, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { useSession } from "@/lib/session";
import type { GameAction, GameView } from "./types";
export type JoinInfo = {
  joinable: boolean;
  name: string;
  players: number;
  code: string;
};
function chime() {
  if (localStorage.getItem("citadel-sound") !== "true") return;
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(587, ctx.currentTime);
    oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
    oscillator.onended = () => void ctx.close();
  } catch {}
}
export function useGame(code: string) {
  const token = useSession();
  const result = useQuery(api.rooms.get, token ? { token, code } : "skip");
  const act = useMutation(api.rooms.act);
  const connection = useConvexConnectionState();
  const [busy, setBusy] = useState(false);
  const acting = useRef(false);
  const hadTurn = useRef(false);
  const game = (result?.game as GameView | undefined) ?? null;
  const version = game?.version;
  useEffect(() => {
    if (!game) return;
    const mine =
      game.active === game.me &&
      game.phase !== "finished" &&
      game.phase !== "lobby";
    if (mine && !hadTurn.current) chime();
    hadTurn.current = mine;
  }, [game]);
  const send = useCallback(
    async (action: GameAction | { type: "join"; name: string }) => {
      if (acting.current || !token) return false;
      acting.current = true;
      setBusy(true);
      try {
        await act({
          token,
          code,
          action: { ...action, version },
        });
        return true;
      } catch (e) {
        toast.error(errorMessage(e));
        return false;
      } finally {
        acting.current = false;
        setBusy(false);
      }
    },
    [act, code, token, version],
  );
  return {
    game,
    join: (result?.join as JoinInfo | undefined) ?? null,
    error: result?.error ?? "",
    connected: connection.isWebSocketConnected || !connection.hasEverConnected,
    busy,
    send,
  };
}
export function errorMessage(e: unknown) {
  return e instanceof ConvexError && typeof e.data === "string"
    ? e.data
    : "Connection interrupted. Your game is saved.";
}
