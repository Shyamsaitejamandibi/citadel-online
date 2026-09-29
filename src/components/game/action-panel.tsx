"use client";
import {
  ArrowRight,
  Coins,
  Layers3,
  Check,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Anvil,
  FlaskConical,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { character, district } from "@/lib/game/catalog";
import { ROLE_ICONS } from "./character-card";
import type { GameAction, GameView } from "@/lib/game/types";
export function ActionPanel({
  g,
  busy,
  send,
  onPower,
}: {
  g: GameView;
  busy: boolean;
  send: (a: GameAction) => Promise<boolean>;
  onPower: (type: "ability" | "laboratory") => void;
}) {
  const p = g.players.find((p) => p.id === g.me)!;
  const mine = g.active === g.me;
  const role = g.activeRole ? character(g.activeRole) : null;
  const Icon = role ? ROLE_ICONS[role.id - 1] : ShieldCheck;
  const income = role?.income
    ? p.city.filter(
        (c) =>
          district(c).type === role.income ||
          district(c).id === "school-of-magic",
      ).length
    : 0;
  const active = g.players.find((p) => p.id === g.active);
  return (
    <section className="action-panel">
      <p className="eyebrow">
        {g.phase === "finished"
          ? "A STORY TO REMEMBER"
          : mine
            ? "THE CITY IS IN YOUR HANDS"
            : "AROUND THE TABLE"}
      </p>
      {g.phase === "draft" ? (
        <>
          <h3>{mine ? "Choose your identity." : "A little mystery."}</h3>
          <p>
            {mine
              ? g.draftDiscard
                ? "Set one character aside, face down."
                : "Your character stays secret until their turn. Choose a power that suits your plans."
              : `${active?.name} is choosing a secret character. Yours will be revealed only when called.`}
          </p>
          {p.roles.length > 0 && (
            <div className="hint-box">
              <ShieldCheck size={16} />
              <span>
                Your secret {p.roles.length > 1 ? "characters" : "character"}:{" "}
                <strong>
                  {p.roles.map((r) => character(r).name).join(" & ")}
                </strong>
              </span>
            </div>
          )}
          <div className="action-divider" />
          <p className="power-copy">
            {g.faceup.length
              ? `Sitting out this round: ${g.faceup.map((r) => character(r).name).join(", ")}.`
              : "Every character could be in play this round."}
          </p>
        </>
      ) : g.phase === "recovery" ? (
        <>
          <h3>The Graveyard</h3>
          <p>
            {mine
              ? `Recover the ${g.recovery ? district(g.recovery.card).name : "destroyed district"} for one gold, or let it return to the deck.`
              : `Waiting for ${active?.name} to use their Graveyard.`}
          </p>
          {mine && (
            <div className="action-buttons">
              <Button disabled={busy} onClick={() => send({ type: "recover" })}>
                <Coins />
                Recover for 1 gold
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => send({ type: "pass-recovery" })}
              >
                Let it go
                <ArrowRight />
              </Button>
            </div>
          )}
        </>
      ) : g.phase === "finished" ? (
        <>
          <h3>Every point tells a story.</h3>
          <p>
            Your city’s district values, diversity bonus, completion bonus, and
            special buildings have all been counted.
          </p>
          <Link href="/" className="inline-link">
            Back to the great hall
            <ArrowRight size={14} />
          </Link>
        </>
      ) : mine && role ? (
        <>
          <div className="role-badge">
            <Icon size={24} strokeWidth={1.3} />
            <span>The {role.name}</span>
            <small>RANK {role.id}</small>
          </div>
          <div className="turn-steps">
            <div className={`turn-step ${g.gathered ? "done" : "current"}`}>
              <span>{g.gathered ? <Check size={10} /> : 1}</span>Gather
            </div>
            <div
              className={`turn-step ${g.builds ? "done" : g.gathered ? "current" : ""}`}
            >
              <span>{g.builds ? <Check size={10} /> : 2}</span>Build
            </div>
            <div className="turn-step">
              <span>3</span>Finish
            </div>
          </div>
          <p className="power-copy">{role.description}</p>
          <div className="action-buttons">
            {!g.gathered && !g.choices.length && (
              <>
                <Button disabled={busy} onClick={() => send({ type: "gold" })}>
                  <Coins />
                  Take 2 gold
                  <ArrowRight className="ml-auto" />
                </Button>
                <Button
                  disabled={busy || g.deckCount === 0}
                  variant="outline"
                  onClick={() => send({ type: "draw" })}
                >
                  <Layers3 />
                  Draw district cards
                  <ArrowRight className="ml-auto" />
                </Button>
              </>
            )}
            {g.choices.length > 0 && (
              <p className="text-[10px] text-muted-foreground col-span-2">
                Choose your cards on the table to continue.
              </p>
            )}
            {role.income && !g.incomeUsed && !g.choices.length && (
              <Button
                variant="outline"
                disabled={busy || income === 0}
                onClick={() => send({ type: "income" })}
              >
                <Coins />
                Collect district income (+{income})
              </Button>
            )}
            {[1, 2, 3, 8].includes(role.id) &&
              !g.abilityUsed &&
              !g.choices.length && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => onPower("ability")}
                >
                  <Sparkles />
                  {role.id === 1
                    ? "Choose assassination target"
                    : role.id === 2
                      ? "Choose robbery target"
                      : role.id === 3
                        ? "Exchange district cards"
                        : "Lay siege to a district"}
                </Button>
              )}
            {p.city.some((c) => district(c).id === "smithy") &&
              !g.districtUsed.includes("smithy") &&
              !g.choices.length && (
                <Button
                  variant="outline"
                  disabled={busy || p.gold < 2 || g.deckCount === 0}
                  onClick={() => send({ type: "smithy" })}
                >
                  <Anvil />
                  Smithy · 2 gold for 3 cards
                </Button>
              )}
            {p.city.some((c) => district(c).id === "laboratory") &&
              !g.districtUsed.includes("laboratory") &&
              !g.choices.length && (
                <Button
                  variant="outline"
                  disabled={busy || p.hand.length === 0}
                  onClick={() => onPower("laboratory")}
                >
                  <FlaskConical />
                  Laboratory · discard for 1 gold
                </Button>
              )}
            {g.gathered && (
              <Button disabled={busy} onClick={() => send({ type: "end" })}>
                End my turn
                <ArrowRight className="ml-auto" />
              </Button>
            )}
          </div>
          {g.gathered && (
            <p className="mt-3 text-[9px] text-muted-foreground">
              {g.builds < (role.id === 7 ? 3 : 1)
                ? "Select a card in your hand to build a district."
                : "Your building is complete for this turn."}
            </p>
          )}
        </>
      ) : (
        <>
          <h3>{active?.name}’s turn.</h3>
          <p>
            {role
              ? `The ${role.name} is making their move. Plan your next district while you wait.`
              : "The city is coming to life."}
          </p>
          {role && (
            <div className="hint-box">
              <Icon size={17} />
              <span>{role.hint}</span>
            </div>
          )}
          <Link href="/how-to-play" className="inline-link">
            <BookOpen size={13} />
            Refresh the rules
            <ArrowRight size={13} />
          </Link>
        </>
      )}
    </section>
  );
}
