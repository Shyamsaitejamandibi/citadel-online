"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameAction, GameView } from "./types";
export type JoinInfo = {
  joinable: boolean;
  name: string;
  players: number;
  code: string;
};
export function useGame(code: string) {
  const [game, setGame] = useState<GameView | null>(null);
  const [join, setJoin] = useState<JoinInfo | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(true);
  const [busy, setBusy] = useState(false);
  const current = useRef<GameView | null>(null);
  const acting = useRef(false);
  const hadTurn = useRef(false);
  const update = useCallback((next: GameView) => {
    if (current.current && next.version <= current.current.version) return;
    const mine =
      next.active === next.me &&
      next.phase !== "finished" &&
      next.phase !== "lobby";
    if (
      mine &&
      !hadTurn.current &&
      localStorage.getItem("citadel-sound") === "true"
    ) {
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
    hadTurn.current = mine;
    current.current = next;
    setGame(next);
    setJoin(null);
    setError("");
  }, []);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        if (!acting.current) {
          const r = await fetch(`/api/rooms/${code}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const data = await r.json();
          if (stopped) return;
          if (!r.ok) {
            setError(data.error);
            return;
          }
          setConnected(true);
          if (data.game) update(data.game);
          else setJoin(data);
        }
      } catch (e) {
        if (!stopped && !(e instanceof DOMException && e.name === "AbortError"))
          setConnected(false);
      } finally {
        if (!stopped) timer = setTimeout(poll, 1000);
      }
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [code, update]);
  const send = useCallback(
    async (action: GameAction | { type: "join"; name: string }) => {
      if (acting.current) return false;
      acting.current = true;
      setBusy(true);
      try {
        const r = await fetch(`/api/rooms/${code}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...action,
            version: current.current?.version,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        update(data.game);
        setConnected(true);
        return true;
      } catch (e) {
        toast.error(
          e instanceof Error
            ? e.message
            : "Connection interrupted. Your game is saved.",
        );
        return false;
      } finally {
        acting.current = false;
        setBusy(false);
      }
    },
    [code, update],
  );
  return { game, join, error, connected, busy, send };
}
