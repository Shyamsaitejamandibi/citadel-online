"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Coins,
  Crown,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APPRENTICE, createLesson, lessonMove } from "@/lib/game/lesson";
import { district } from "@/lib/game/catalog";
import { score } from "@/lib/game/engine";
import type { GameAction } from "@/lib/game/types";
import { CharacterCard } from "./character-card";
import { DistrictCard } from "./district-card";

export function FirstTurn({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="first-turn-dialog">
        {open && <Lesson close={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Lesson({ close }: { close: () => void }) {
  const [game, setGame] = useState(createLesson);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const me = game.players[0];
  const step = done
    ? 4
    : game.phase === "draft"
      ? 0
      : !game.gathered
        ? 1
        : game.builds === 0
          ? 2
          : 3;
  const titles = [
    "A new round. A secret identity.",
    "Take gold, or take possibilities.",
    "Lay your first stone.",
    "Pass the spotlight.",
    "You’ve built more than a city.",
  ];
  const copy = [
    "Everyone picks a character in secret. Try the Merchant: a little extra gold goes a long way.",
    "Characters are called from 1 to 8. It’s your turn as the Merchant. Gather 2 gold, or draw 2 cards and keep 1. Your extra Merchant gold is automatic.",
    "Pay the cost on a card to build it. Most characters can build one district each turn. Select a card to see what you can afford.",
    "Your district is worth points, and its color matters. Collect your trade income, then end your turn so the next character can play.",
    "You picked a secret character, gathered resources, and built a district. A new identity next round means a new strategy. Your first real table is waiting.",
  ];
  function move(action: GameAction) {
    setGame((g) => lessonMove(g, action));
    setSelected(null);
    if (action.type === "end") setDone(true);
  }
  return (
    <>
      <div className="lesson-topline">
        <span>
          <Sparkles size={15} /> YOUR FIRST TURN
        </span>
        <span>2 MIN · NO SIGN-UP</span>
      </div>
      <ol className="lesson-progress" aria-label="Lesson progress">
        {["Choose", "Gather", "Build", "Pass"].map((label, i) => (
          <li
            key={label}
            className={step > i ? "done" : step === i ? "current" : ""}
            aria-current={step === i ? "step" : undefined}
          >
            <span>{step > i ? <Check size={12} /> : i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <DialogHeader>
        <DialogTitle>{titles[step]}</DialogTitle>
        <DialogDescription>{copy[step]}</DialogDescription>
      </DialogHeader>
      <div className="lesson-wallet">
        <span>
          <Coins size={16} />
          <b>{me.gold}</b> gold
        </span>
        <span>
          <Layers3 size={16} />
          <b>{me.hand.length}</b> cards
        </span>
        <span>
          <Crown size={16} />
          <b>{score(game, me).total}</b> points
        </span>
      </div>
      {step === 0 && (
        <div className="lesson-character">
          <CharacterCard id={6} />
          <Button onClick={() => move({ type: "draft", role: 6 })}>
            Choose the Merchant <ArrowRight />
          </Button>
          <small>
            <ShieldCheck size={13} /> Your identity stays private until called.
          </small>
        </div>
      )}
      {step === 1 &&
        (game.choices.length ? (
          <>
            <div className="lesson-cards">
              {game.choices.map((card) => (
                <DistrictCard
                  key={card}
                  card={card}
                  compact
                  selected={selected === card}
                  onClick={() => setSelected(card)}
                />
              ))}
            </div>
            <Button
              disabled={!selected}
              onClick={() =>
                selected && move({ type: "keep", cards: [selected] })
              }
            >
              Keep selected card <Check />
            </Button>
          </>
        ) : (
          <div className="lesson-actions">
            <Button onClick={() => move({ type: "gold" })}>
              <Coins /> Take 2 gold
            </Button>
            <Button variant="outline" onClick={() => move({ type: "draw" })}>
              <Layers3 /> Draw 2 cards, keep 1
            </Button>
          </div>
        ))}
      {step === 2 && (
        <>
          <div className="lesson-cards">
            {me.hand.map((card) => (
              <DistrictCard
                key={card}
                card={card}
                compact
                selected={selected === card}
                badge={
                  district(card).cost <= me.gold
                    ? "Tap to build"
                    : `Need ${district(card).cost - me.gold} more gold`
                }
                onClick={() => setSelected(card)}
              />
            ))}
          </div>
          <Button
            disabled={!selected || district(selected).cost > me.gold}
            onClick={() => selected && move({ type: "build", card: selected })}
          >
            {selected
              ? `Build ${district(selected).name} for ${district(selected).cost} gold`
              : "Select your first district"}
            <ArrowRight />
          </Button>
        </>
      )}
      {step === 3 && (
        <>
          <div className="lesson-built">
            <DistrictCard card={me.city[0]} compact />
            <div>
              <Check size={22} />
              <h3>Your city is taking shape.</h3>
              <p>
                Build all five district colors for a 3-point bonus. Finishing
                your city triggers the final round; the highest score wins.
              </p>
            </div>
          </div>
          {me.city.some((c) => district(c).type === "trade") &&
            !game.incomeUsed && (
              <Button
                variant="outline"
                onClick={() => move({ type: "income" })}
              >
                <Coins /> Collect trade income
              </Button>
            )}
          <Button onClick={() => move({ type: "end" })}>
            End my turn <ArrowRight />
          </Button>
        </>
      )}
      {done && (
        <div className="lesson-complete">
          <Crown size={40} />
          <p>
            Secret identities. Shared stories.
            <br />
            That’s Citadels.
          </p>
          <Button onClick={close}>
            I’m ready for the table <ArrowRight />
          </Button>
          <Link href="/how-to-play" onClick={close}>
            Explore the full rules
          </Link>
          <button
            onClick={() => {
              setGame(createLesson());
              setDone(false);
              setSelected(null);
            }}
          >
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )}
      <span className="lesson-note">
        A guided practice turn with computer seats. Your online games are played
        with real people.
      </span>
      <span className="sr-only">Lesson player: {APPRENTICE}</span>
    </>
  );
}
