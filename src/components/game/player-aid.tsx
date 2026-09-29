"use client";
import { useState } from "react";
import { BookOpenText, Coins, Hammer, Layers3, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { character } from "@/lib/game/catalog";
import type { GameView } from "@/lib/game/types";

// Mirrors the reference card in the physical box: turn summary on one side,
// the eight characters in calling order on the other.
const SHORT: Record<number, string> = {
  1: "Name a character. That player silently skips their turn.",
  2: "Name a character (not the Assassin or their victim). Take all their gold when they’re called.",
  3: "Swap your whole hand with a player, OR discard any cards and draw that many.",
  4: "Take the crown and pick first next round. +1 gold per noble (yellow) district.",
  5: "+1 gold per religious (blue) district. The Warlord can’t touch your city.",
  6: "+1 gold after your action. +1 gold per trade (green) district.",
  7: "Draw 2 extra cards. Build up to 3 districts this turn.",
  8: "+1 gold per military (red) district. Destroy a district by paying its cost − 1.",
};
export function PlayerAid({ g }: { g: GameView }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"turn" | "characters">("turn");
  const close = (v: boolean) => {
    setOpen(v);
  };
  return (
    <>
      <Button
        variant="outline"
        className="aid-button"
        onClick={() => close(true)}
        aria-label="Open the player aid card"
      >
        <BookOpenText size={14} />
        <span>Player aid</span>
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="aid-dialog">
          <DialogHeader>
            <DialogTitle>Player aid</DialogTitle>
            <DialogDescription>
              The same reference card you’d find in the box. Open it any time.
            </DialogDescription>
          </DialogHeader>
          <div className="aid-flip" role="tablist">
            <button
              role="tab"
              aria-selected={side === "turn"}
              className={side === "turn" ? "active" : ""}
              onClick={() => setSide("turn")}
            >
              How a round works
            </button>
            <button
              role="tab"
              aria-selected={side === "characters"}
              className={side === "characters" ? "active" : ""}
              onClick={() => setSide("characters")}
            >
              The 8 characters
            </button>
          </div>
          {side === "turn" ? (
            <div className="aid-card">
              <ol className="aid-round">
                <li>
                  <b>Pick in secret.</b> Starting with the crown, everyone
                  chooses one character and passes the rest on.
                </li>
                <li>
                  <b>Characters are called 1 → 8.</b> When yours is called, you
                  reveal it and take your turn.
                </li>
              </ol>
              <h4>On your turn</h4>
              <div className="aid-step">
                <span>1</span>
                <div>
                  <b>Take an action</b>
                  <p>
                    <Coins size={12} /> Take 2 gold <em>or</em>{" "}
                    <Layers3 size={12} /> draw 2 district cards and keep 1.
                  </p>
                </div>
              </div>
              <div className="aid-step">
                <span>2</span>
                <div>
                  <b>Build one district</b>
                  <p>
                    <Hammer size={12} /> Pay its cost in gold. You can never
                    have two identical districts.
                  </p>
                </div>
              </div>
              <div className="aid-step power">
                <span>
                  <Sparkles size={11} />
                </span>
                <div>
                  <b>Use your character’s power</b>
                  <p>Once, at any time during your turn.</p>
                </div>
              </div>
              <h4>Game end &amp; scoring</h4>
              <p className="aid-small">
                When someone builds their {g.target}th district, finish the
                round. Score:
              </p>
              <ul className="aid-score">
                <li>
                  <b>+cost</b> of every district in your city
                </li>
                <li>
                  <b>+3</b> if you have all 5 district colors
                </li>
                <li>
                  <b>+4</b> for the first to complete a city
                </li>
                <li>
                  <b>+2</b> for everyone else who completes
                </li>
              </ul>
            </div>
          ) : (
            <div className="aid-characters">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((r) => {
                const state =
                  g.phase === "draft" || g.phase === "turn"
                    ? g.faceup.includes(r)
                      ? "Set aside"
                      : g.activeRole === r
                        ? "Acting now"
                        : g.activeRole > r
                          ? "Done"
                          : ""
                    : "";
                return (
                  <div
                    key={r}
                    className={`aid-character ${state === "Set aside" ? "out" : ""} ${state === "Acting now" ? "now" : ""}`}
                  >
                    <span
                      className="aid-portrait"
                      style={{
                        backgroundImage: `url(/art/character-${r}.webp)`,
                      }}
                    >
                      <b>{r}</b>
                    </span>
                    <div>
                      <strong>
                        {character(r).name}
                        {state && <small>{state}</small>}
                      </strong>
                      <p>{SHORT[r]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
