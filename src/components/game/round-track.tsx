"use client";
import { useState } from "react";
import { Check, Crown, Layers3, Skull } from "lucide-react";
import { CHARACTERS } from "@/lib/game/catalog";
import type { GameView } from "@/lib/game/types";
import { CharacterCard } from "./character-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RoundTrack({ g }: { g: GameView }) {
  const [inspect, setInspect] = useState<number | null>(null);
  return (
    <section className="calling-order" aria-label="Character calling order">
      <div className="calling-heading">
        <span>
          <Crown size={13} />
          ROUND {String(g.round).padStart(2, "0")}
        </span>
        <span>
          {g.phase === "draft"
            ? "CHOOSE IN SECRET · REVEAL IN ORDER"
            : "CHARACTERS ARE CALLED FROM 1 TO 8"}
        </span>
        <span>
          <Layers3 size={13} />
          {g.deckCount} IN DECK
        </span>
      </div>
      <div className="calling-characters">
        {CHARACTERS.map((role) => {
          const called = g.phase !== "draft" && g.activeRole >= role.id;
          const current =
            g.phase !== "draft" &&
            g.phase !== "finished" &&
            g.activeRole === role.id;
          const out = g.faceup.includes(role.id);
          const killed = g.killed === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setInspect(role.id)}
              className={`${current ? "current" : ""} ${called ? "called" : ""} ${out ? "out" : ""} ${killed ? "marked" : ""}`}
              aria-label={`${role.id}. ${role.name}${current ? ", playing now" : out ? ", set aside" : killed ? ", assassinated" : called ? ", called" : ", not called yet"}`}
              aria-current={current ? "step" : undefined}
            >
              <span
                className="calling-portrait"
                style={{
                  backgroundImage: `url(/art/character-${role.id}.webp)`,
                }}
              >
                <i>{role.id}</i>
                {killed ? (
                  <Skull size={15} />
                ) : called && !current ? (
                  <Check size={13} />
                ) : null}
              </span>
              <strong>{role.name}</strong>
              <small>
                {current
                  ? "PLAYING"
                  : out
                    ? "SET ASIDE"
                    : killed
                      ? "MARKED"
                      : called
                        ? "CALLED"
                        : ""}
              </small>
            </button>
          );
        })}
      </div>
      <Dialog
        open={inspect !== null}
        onOpenChange={(open) => {
          if (!open) setInspect(null);
        }}
      >
        <DialogContent className="character-dialog">
          <DialogHeader>
            <DialogTitle>Know the calling order.</DialogTitle>
            <DialogDescription>
              Everyone chooses secretly. Characters play from rank 1 to 8,
              regardless of where their players are seated.
            </DialogDescription>
          </DialogHeader>
          {inspect && <CharacterCard id={inspect} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
