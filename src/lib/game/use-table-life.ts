"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
const HEARTBEAT = 10_000;
const AWAY_AFTER = 30_000;
// A clock that re-renders every `ms` so time-based UI (online dots, timers)
// stays fresh without server round trips.
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
export function usePresence(
  code: string,
  token: string | null,
  seated: boolean,
) {
  const beat = useMutation(api.social.heartbeat);
  const rows = useQuery(api.social.presence, { code });
  const now = useNow(5000);
  useEffect(() => {
    if (!token || !seated) return;
    const send = () => void beat({ token, code }).catch(() => {});
    send();
    const t = setInterval(send, HEARTBEAT);
    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [beat, code, token, seated]);
  const online = new Set(
    (rows ?? [])
      .filter((r) => now - r.lastSeen < AWAY_AFTER)
      .map((r) => r.player),
  );
  return online;
}
export type LiveReaction = {
  id: string;
  player: string;
  emoji: string;
  at: number;
};
export function useReactions(code: string, token: string | null) {
  const rows = useQuery(api.social.reactions, { code });
  const react = useMutation(api.social.react);
  const now = useNow(500);
  const [mounted] = useState(() => Date.now());
  const live = (rows ?? []).filter(
    (r) => r.at > mounted - 1000 && now - r.at < 3500,
  ) as LiveReaction[];
  return {
    live,
    send: (emoji: string) =>
      token ? void react({ token, code, emoji }).catch(() => {}) : undefined,
  };
}
