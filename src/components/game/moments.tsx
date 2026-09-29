"use client";
import { useEffect, useState } from "react";
import { character, district } from "@/lib/game/catalog";
import type { GameView, Moment } from "@/lib/game/types";
import { usePreference } from "@/lib/preferences";

type Beat = {
  key: string;
  tone: "calm" | "dark" | "gold" | "you";
  eyebrow: string;
  title: string;
  detail?: string;
  role?: number;
  ms: number;
  silence?: number[];
};

const name = (g: GameView, id: string) =>
  id === g.me ? "You" : (g.players.find((p) => p.id === id)?.name ?? "Someone");

function beatFor(g: GameView, m: Moment, key: string): Beat | null {
  switch (m.type) {
    case "round":
      return {
        key,
        tone: "calm",
        eyebrow: `ROUND ${m.round}`,
        title: "A new round begins.",
        detail:
          m.crown === g.me
            ? "You hold the crown, so you pick your secret character first."
            : `${name(g, m.crown)} holds the crown and picks first. Everyone chooses a secret character.`,
        ms: 2600,
      };
    case "reveal":
      return {
        key,
        tone: m.player === g.me ? "you" : "calm",
        eyebrow: `THE ${character(m.role).name.toUpperCase()} IS CALLED…`,
        title:
          m.player === g.me
            ? `That’s you! Your turn as the ${character(m.role).name}.`
            : `${name(g, m.player)} steps forward.`,
        detail: character(m.role).description,
        role: m.role,
        ms: m.player === g.me ? 3000 : 2400,
      };
    case "unanswered":
      return {
        key,
        tone: "calm",
        eyebrow: `THE ${character(m.role).name.toUpperCase()} IS CALLED…`,
        title: "Silence. No one answers.",
        detail: "That character was set aside face down this round.",
        role: m.role,
        ms: 1800,
        silence: [m.role],
      };
    case "killed":
      return {
        key,
        tone: "dark",
        eyebrow: `THE ${character(m.role).name.toUpperCase()} IS CALLED…`,
        title: "…but they were murdered in the night.",
        detail: `Whoever chose the ${character(m.role).name} loses this turn.`,
        role: m.role,
        ms: 3000,
      };
    case "target":
      return {
        key,
        tone: "dark",
        eyebrow: m.by === 1 ? "THE ASSASSIN STRIKES" : "THE THIEF IS WATCHING",
        title:
          m.by === 1
            ? `The ${character(m.role).name} has been marked for death.`
            : `The ${character(m.role).name}’s purse is in danger.`,
        detail:
          m.by === 1
            ? "If someone chose that character, they will skip their turn."
            : "If someone chose that character, the Thief takes all their gold when they’re called.",
        role: m.role,
        ms: 2600,
      };
    case "robbed":
      return {
        key,
        tone: "dark",
        eyebrow: "ROBBED!",
        title: `${name(g, m.player)} ${m.player === g.me ? "lose" : "loses"} ${m.gold} gold to ${name(g, m.thief)}.`,
        role: 2,
        ms: 2600,
      };
    case "destroyed":
      return {
        key,
        tone: "dark",
        eyebrow: "THE WARLORD ATTACKS",
        title: `${name(g, m.by)} ${m.by === g.me ? "destroy" : "destroys"} ${m.player === g.me ? "your" : `${name(g, m.player)}’s`} ${district(m.card).name}.`,
        role: 8,
        ms: 2600,
      };
    case "complete":
      return {
        key,
        tone: "gold",
        eyebrow: "FINAL ROUND",
        title: `${name(g, m.player)} ${m.player === g.me ? "have" : "has"} completed a city!`,
        detail: "This is the last round. Finish it well: every point counts.",
        ms: 3200,
      };
    case "winner":
      return {
        key,
        tone: "gold",
        eyebrow: "THE REALM HAS SPOKEN",
        title: m.players.includes(g.me)
          ? "The crown is yours!"
          : `${m.players.map((p) => name(g, p)).join(" & ")} ${m.players.length > 1 ? "share" : "takes"} the crown.`,
        ms: 3400,
      };
  }
}

// Back-to-back unanswered calls read as one beat: "The Thief, Magician…".
function mergeSilence(beats: Beat[]) {
  const out: Beat[] = [];
  for (const b of beats) {
    const prev = out.at(-1);
    if (prev?.silence && b.silence) {
      const roles = [...prev.silence, ...b.silence];
      const names = roles.map((r) => character(r).name.toUpperCase());
      out[out.length - 1] = {
        ...prev,
        silence: roles,
        eyebrow: `THE ${names.slice(0, -1).join(", ")} & ${names.at(-1)} ARE CALLED…`,
        detail: "None of these characters are in play this round.",
      };
    } else out.push(b);
  }
  return out;
}

// Plays the table's big moments (reveals, murders, final round) full-screen
// for every player at once, like everyone looking up from the table.
export function Moments({ g }: { g: GameView }) {
  const lastId = g.log.at(-1)?.id ?? 0;
  const [seen, setSeen] = useState<number | null>(null);
  const [draftTurn, setDraftTurn] = useState<string | null>(null);
  const [queue, setQueue] = useState<Beat[]>([]);
  if (seen === null) setSeen(lastId);
  else if (lastId !== seen) {
    // A new game restarts the log, so everything in it is new.
    const from = lastId < seen ? 0 : seen;
    const beats = g.log
      .filter((l) => l.id > from && l.moment)
      .map((l) => beatFor(g, l.moment!, `${g.round}-${l.id}`))
      .filter((b): b is Beat => b !== null);
    // After a long absence only replay the most recent beats.
    setQueue((q) => mergeSilence([...q, ...beats]).slice(-4));
    setSeen(lastId);
  }
  const myPick =
    g.phase === "draft" && g.active === g.me
      ? `${g.round}-${g.draftIndex}`
      : null;
  if (myPick !== draftTurn) {
    setDraftTurn(myPick);
    if (myPick)
      setQueue((q) => [
        ...q,
        {
          key: `pick-${myPick}`,
          tone: "you",
          eyebrow: "YOUR PICK",
          title: g.draftDiscard
            ? "Set one character aside."
            : "Choose your secret character.",
          detail: g.draftDiscard
            ? "Pick one to remove face down. No one will see it."
            : g.draftIndex < g.players.length
              ? "Characters act in number order, 1 to 8. Nobody sees your pick until you’re called."
              : "Pick your second character for this round.",
          ms: g.draftIndex < g.players.length ? 2200 : 1400,
        },
      ]);
  }
  const enabled = usePreference("citadel-moments", "on")[0] !== "off";
  const beat = enabled ? queue[0] : undefined;
  useEffect(() => {
    if (!beat) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const t = setTimeout(
      () => setQueue((q) => q.slice(1)),
      reduced ? Math.min(beat.ms, 1500) : beat.ms,
    );
    return () => clearTimeout(t);
  }, [beat]);
  if (!beat) return null;
  return (
    <button
      type="button"
      key={beat.key}
      className={`moment moment-${beat.tone}`}
      onClick={() => setQueue((q) => q.slice(1))}
      aria-label="Dismiss"
    >
      <div className="moment-card">
        {beat.role && (
          <span
            className="moment-portrait"
            style={{ backgroundImage: `url(/art/character-${beat.role}.webp)` }}
          >
            <b>{beat.role}</b>
          </span>
        )}
        <p className="moment-eyebrow">{beat.eyebrow}</p>
        <h2>{beat.title}</h2>
        {beat.detail && <p className="moment-detail">{beat.detail}</p>}
        <span className="moment-skip">Tap to continue</span>
      </div>
    </button>
  );
}
