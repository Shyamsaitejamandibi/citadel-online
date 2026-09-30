"use client";
import { useEffect, useRef, useState } from "react";
import { History, X } from "lucide-react";
import type { GameView } from "@/lib/game/types";

export function CatchUp({ g }: { g: GameView }) {
  const latest = useRef(g);
  const [missed, setMissed] = useState<string[]>([]);
  useEffect(() => {
    latest.current = g;
  }, [g]);
  useEffect(() => {
    let last = latest.current.log.at(-1)?.id ?? 0;
    function visibility() {
      if (document.visibilityState === "hidden")
        last = latest.current.log.at(-1)?.id ?? 0;
      else {
        const moves = latest.current.log.filter(
          (l) => l.id > last && l.kind !== "chat",
        );
        if (moves.length) setMissed(moves.slice(-3).map((l) => l.text));
      }
    }
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [g.code]);
  if (!missed.length) return null;
  return (
    <div className="catch-up" role="status">
      <History size={18} />
      <div>
        <strong>While you were away</strong>
        {missed.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </div>
      <button aria-label="Dismiss catch-up" onClick={() => setMissed([])}>
        <X size={17} />
      </button>
    </div>
  );
}
