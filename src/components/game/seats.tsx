"use client";
import { Castle, Coins, Crown, Layers3, Trophy } from "lucide-react";
import { character } from "@/lib/game/catalog";
import { REACTIONS } from "@/lib/game/reactions";
import type { GameView, PublicPlayer } from "@/lib/game/types";
import { useNow, type LiveReaction } from "@/lib/game/use-table-life";
import { Avatar } from "./avatar";

export function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function status(g: GameView, p: PublicPlayer, now: number) {
  const acting = g.active === p.id;
  const timer = g.turnAt ? ` · ${clock(now - g.turnAt)}` : "";
  if (p.bot) return { text: "On autopilot", live: acting };
  if (g.phase === "draft") {
    if (acting) return { text: `Choosing in secret…${timer}`, live: true };
    const picks = g.draftOrder.slice(0, g.draftIndex);
    return picks.includes(p.id)
      ? { text: "Has picked ✓", live: false }
      : { text: "Waiting to pick", live: false };
  }
  if (g.phase === "recovery" && acting)
    return { text: `Deciding on the Graveyard…${timer}`, live: true };
  if (g.phase === "turn" && acting)
    return {
      text: `Playing the ${character(g.activeRole).name}${timer}`,
      live: true,
    };
  if (g.phase === "finished")
    return { text: `${p.score.total} points`, live: false };
  return {
    text: p.revealed.length
      ? `Was the ${p.revealed.map((r) => character(r).name).join(" & ")}`
      : "Character hidden",
    live: false,
  };
}

export function SeatStrip({
  g,
  online,
  reactions,
  onInspect,
}: {
  g: GameView;
  online: Set<string>;
  reactions: LiveReaction[];
  onInspect: (id: string) => void;
}) {
  const now = useNow(1000);
  return (
    <div
      className="player-strip"
      style={{ "--players": g.players.length } as React.CSSProperties}
    >
      {g.players.map((p) => {
        const s = status(g, p, now);
        const wins = g.series?.wins[p.id] ?? 0;
        return (
          <button
            key={p.id}
            className={`player-seat ${s.live && g.phase !== "finished" ? "current" : ""} ${!online.has(p.id) && !p.bot ? "is-away" : ""}`}
            onClick={() => onInspect(p.id)}
            aria-label={`Inspect ${p.name}’s city`}
          >
            <span className="seat-reactions" aria-hidden>
              {reactions
                .filter((r) => r.player === p.id)
                .map((r) => (
                  <i key={r.id}>{r.emoji}</i>
                ))}
            </span>
            <div className="seat-top">
              <Avatar
                id={p.id}
                name={p.name}
                online={p.bot ? undefined : online.has(p.id)}
                size={30}
              />
              <span>{p.id === g.me ? `${p.name} (you)` : p.name}</span>
              {p.id === g.crown && <Crown size={13} aria-label="Crown" />}
            </div>
            <div className="seat-stats">
              <span title="Gold">
                <Coins size={11} />
                {p.gold}
              </span>
              <span title="Districts built">
                <Castle size={11} />
                {p.city.length}/{g.target}
              </span>
              <span title="Cards in hand">
                <Layers3 size={11} />
                {p.handCount}
              </span>
              {wins > 0 && (
                <span title="Games won at this table">
                  <Trophy size={11} />
                  {wins}
                </span>
              )}
            </div>
            <span className={`seat-role ${s.live ? "live" : ""}`}>
              {!online.has(p.id) && !p.bot && p.id !== g.me
                ? "Away · " + s.text
                : s.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ReactionBar({ send }: { send: (emoji: string) => void }) {
  return (
    <div className="reaction-bar" role="group" aria-label="Send a reaction">
      {REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => send(e)}
          aria-label={`React ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
