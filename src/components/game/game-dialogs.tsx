"use client";
import { useState } from "react";
import { Coins, ArrowRight, Check, Sparkles, Pin, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CHARACTERS, character, district } from "@/lib/game/catalog";
import type { GameAction, GameView } from "@/lib/game/types";
import { DistrictCard } from "./district-card";
import { ROLE_ICONS } from "./character-card";
import { buildForecast, buildReason } from "@/lib/game/planning";
export function PowerDialog({
  g,
  kind,
  busy,
  send,
  close,
}: {
  g: GameView;
  kind: "ability" | "laboratory";
  busy: boolean;
  send: (a: GameAction) => Promise<boolean>;
  close: () => void;
}) {
  const [cards, setCards] = useState<string[]>([]);
  const [mode, setMode] = useState("player");
  const p = g.players.find((p) => p.id === g.me)!;
  const role = character(g.activeRole);
  const lab = kind === "laboratory";
  async function act(a: GameAction) {
    if (await send(a)) close();
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent className="setup-dialog">
        <DialogHeader>
          <DialogTitle>
            {lab
              ? "A little alchemy."
              : role.id === 1
                ? "Who disappears tonight?"
                : role.id === 2
                  ? "Whose fortune is yours?"
                  : role.id === 3
                    ? "Change your hand."
                    : "Choose your siege."}
          </DialogTitle>
          <DialogDescription>
            {lab
              ? "Discard one district card from your hand to gain one gold."
              : role.description}
          </DialogDescription>
        </DialogHeader>
        {!lab && (role.id === 1 || role.id === 2) && (
          <div className="power-targets">
            {CHARACTERS.filter((c) => c.id > role.id).map((c) => {
              const Icon = ROLE_ICONS[c.id - 1];
              return (
                <button
                  key={c.id}
                  className="power-target"
                  disabled={busy || (role.id === 2 && c.id === g.killed)}
                  onClick={() => act({ type: "ability", role: c.id })}
                >
                  <Icon size={16} />
                  <span>
                    {c.id}. {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {(lab || role.id === 3) && (
          <>
            {!lab && (
              <div className="filter-tabs">
                <button
                  className={mode === "player" ? "active" : ""}
                  onClick={() => setMode("player")}
                >
                  Swap with a player
                </button>
                <button
                  className={mode === "deck" ? "active" : ""}
                  onClick={() => setMode("deck")}
                >
                  Exchange with the deck
                </button>
              </div>
            )}
            {!lab && mode === "player" ? (
              <div className="power-card-list">
                {g.players
                  .filter((x) => x.id !== g.me)
                  .map((x) => (
                    <button
                      key={x.id}
                      className="power-card-option"
                      disabled={busy}
                      onClick={() => act({ type: "ability", target: x.id })}
                    >
                      {x.name}
                      <span>
                        {x.handCount} cards
                        <ArrowRight size={12} className="inline ml-2" />
                      </span>
                    </button>
                  ))}
              </div>
            ) : (
              <>
                <div className="power-card-list">
                  {p.hand.map((card) => (
                    <button
                      key={card}
                      className={`power-card-option ${cards.includes(card) ? "selected" : ""}`}
                      disabled={busy}
                      onClick={() =>
                        setCards(
                          lab
                            ? [card]
                            : cards.includes(card)
                              ? cards.filter((c) => c !== card)
                              : [...cards, card],
                        )
                      }
                    >
                      {cards.includes(card) ? (
                        <Check size={13} />
                      ) : (
                        <Sparkles size={13} />
                      )}{" "}
                      {district(card).name}
                      <span>{district(card).cost} gold</span>
                    </button>
                  ))}
                </div>
                <Button
                  disabled={busy || cards.length === 0}
                  onClick={() =>
                    act(
                      lab
                        ? { type: "laboratory", card: cards[0] }
                        : { type: "ability", cards },
                    )
                  }
                >
                  {lab
                    ? "Discard for 1 gold"
                    : `Exchange ${cards.length} cards`}
                  <ArrowRight />
                </Button>
              </>
            )}
          </>
        )}
        {!lab && role.id === 8 && (
          <div className="power-card-list">
            {g.players.flatMap((target) =>
              target.city.map((card) => {
                const d = district(card);
                const protectedCity =
                  target.city.length >= g.target ||
                  (target.roles.includes(5) && g.killed !== 5);
                const cost =
                  d.cost -
                  1 +
                  (target.city.some((c) => district(c).id === "great-wall") &&
                  d.id !== "great-wall"
                    ? 1
                    : 0);
                const blocked =
                  protectedCity || d.id === "keep" || cost > p.gold;
                return (
                  <button
                    key={card}
                    className="power-card-option"
                    disabled={busy || blocked}
                    onClick={() =>
                      act({ type: "ability", target: target.id, card })
                    }
                  >
                    <span className="!m-0 !text-foreground">
                      {d.name}
                      <small className="block text-[9px] text-muted-foreground mt-1">
                        {target.name}{" "}
                        {protectedCity || d.id === "keep" ? "· protected" : ""}
                      </small>
                    </span>
                    <span>
                      {cost}
                      <Coins size={12} className="inline ml-1" />
                    </span>
                  </button>
                );
              }),
            )}
            {g.players.every((x) => x.city.length === 0) && (
              <p className="text-xs text-muted-foreground">
                No districts have been built yet.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function InspectDialog({
  g,
  card,
  busy,
  send,
  close,
  planned,
  onPlan,
}: {
  g: GameView;
  card: string;
  busy: boolean;
  send: (a: GameAction) => Promise<boolean>;
  close: () => void;
  planned?: boolean;
  onPlan?: () => void;
}) {
  const p = g.players.find((p) => p.id === g.me)!;
  const inHand = p.hand.includes(card);
  const d = district(card);
  const reason = buildReason(g, card);
  const forecast = buildForecast(g, card);
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {inHand ? "A vision for your city." : "Part of a growing legacy."}
          </DialogTitle>
          <DialogDescription>
            {inHand
              ? "Pay the gold cost to add this district to your city."
              : "Every district contributes its gold value to the final score."}
          </DialogDescription>
        </DialogHeader>
        <div className="inspect-card">
          <DistrictCard card={card} />
        </div>
        {inHand && (
          <>
            <div className="build-forecast">
              <span>
                <Coins size={16} />
                <strong>
                  {p.gold} − {d.cost} ={" "}
                  {forecast.goldAfter >= 0
                    ? forecast.goldAfter
                    : `need ${-forecast.goldAfter}`}
                </strong>
                <small>
                  {forecast.goldAfter >= 0
                    ? "GOLD LEFT AFTER BUILDING"
                    : "MORE GOLD REQUIRED"}
                </small>
              </span>
              <span>
                <Trophy size={16} />
                <strong>+{forecast.pointsAdded}</strong>
                <small>
                  {forecast.duplicate
                    ? "ALREADY IN YOUR CITY"
                    : forecast.finishesCity
                      ? "POINTS · FINAL ROUND"
                      : forecast.addsColor
                        ? "POINTS · NEW CITY COLOR"
                        : "POINTS TO YOUR CITY"}
                </small>
              </span>
            </div>
            <Button
              disabled={busy || !!reason}
              onClick={async () => {
                if (await send({ type: "build", card })) close();
              }}
            >
              <Coins />
              Build for {d.cost} gold
              <ArrowRight />
            </Button>
            {reason && <p className="inspect-info">{reason}</p>}
            {onPlan && !forecast.duplicate && (
              <Button variant="outline" aria-pressed={planned} onClick={onPlan}>
                <Pin />
                {planned ? "Remove from my plan" : "Plan this district"}
                <span className="plan-private">Only you can see this</span>
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function CityDialog({
  g,
  id,
  close,
  inspect,
}: {
  g: GameView;
  id: string;
  close: () => void;
  inspect: (c: string) => void;
}) {
  const p = g.players.find((p) => p.id === id)!;
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent className="inspect-dialog">
        <DialogHeader>
          <DialogTitle>{p.name}’s city</DialogTitle>
          <DialogDescription>
            {p.city.length}/{g.target} districts · {p.score.total} current
            points · {p.gold} gold · {p.handCount} cards in hand
          </DialogDescription>
        </DialogHeader>
        <div className="inspect-city">
          {p.city.map((c) => (
            <DistrictCard
              key={c}
              card={c}
              compact
              onClick={() => {
                close();
                inspect(c);
              }}
            />
          ))}
        </div>
        {p.city.length === 0 && (
          <p className="text-xs text-muted-foreground py-8 text-center">
            A grand city is still a dream. The first stone will be laid soon.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
