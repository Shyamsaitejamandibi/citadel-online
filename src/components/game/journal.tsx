"use client";
import { useEffect, useRef, useState } from "react";
import { Castle, ChevronDown, ScrollText, Sparkles } from "lucide-react";
import type { GameView } from "@/lib/game/types";

export function Journal({ g }: { g: GameView }) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const entries = g.log.filter((l) => l.kind !== "chat");
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [g.log.length, expanded]);
  return (
    <section className="journal game-journal">
      <button
        className="journal-heading"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`journal-${g.code}`}
      >
        <span>
          <ScrollText size={16} /> The story so far
        </span>
        <ChevronDown size={15} className={expanded ? "expanded" : ""} />
      </button>
      <div
        className={`journal-entries ${expanded ? "expanded" : ""}`}
        ref={ref}
        id={`journal-${g.code}`}
        aria-label="Game journal"
        role="log"
        aria-live="off"
      >
        {entries.slice(-40).map((l, i, all) => (
          <div key={l.id} className={`journal-entry kind-${l.kind}`}>
            {(!i || all[i - 1].round !== l.round) && (
              <span className="log-round">
                {l.round
                  ? `ROUND ${String(l.round).padStart(2, "0")}`
                  : "THE GATHERING"}
              </span>
            )}
            <div className="journal-line">
              {l.kind === "build" ? (
                <Castle size={13} />
              ) : l.kind === "power" ? (
                <Sparkles size={13} />
              ) : (
                <span className="journal-dot" />
              )}
              <span>{l.text}</span>
            </div>
          </div>
        ))}
        {!entries.length && (
          <p className="journal-empty">
            Every choice leaves a mark. Your game’s story will unfold here.
          </p>
        )}
      </div>
    </section>
  );
}
