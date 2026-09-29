"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { preload } from "react-dom";
import {
  Crown,
  Castle,
  Coins,
  Layers3,
  Bot,
  Copy,
  RotateCcw,
  Trophy,
  DoorOpen,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  LoaderCircle,
  Lightbulb,
  Check,
  Flag,
  Volume2,
  VolumeX,
  Settings2,
  Sparkles,
} from "lucide-react";
import { savePreference, usePreference } from "@/lib/preferences";
import { useGame } from "@/lib/game/use-game";
import { character, district } from "@/lib/game/catalog";
import type { GameAction, GameView } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CharacterCard, ROLE_ICONS } from "./character-card";
import { DistrictCard } from "./district-card";
import { ActionPanel } from "./action-panel";
import { Journal } from "./journal";
import { Lobby, copyInvite } from "./lobby";
import { CityDialog, InspectDialog, PowerDialog } from "./game-dialogs";
import { usePresence, useReactions } from "@/lib/game/use-table-life";
import { Moments } from "./moments";
import { PlayerAid } from "./player-aid";
import { ReactionBar, SeatStrip, clock } from "./seats";
import { Avatar } from "./avatar";
import { useNow } from "@/lib/game/use-table-life";
export function GameTable({ code }: { code: string }) {
  const { token, game: g, join, error, connected, busy, send } = useGame(code);
  const online = usePresence(code, token, !!g);
  const { live: reactions, send: react } = useReactions(code, token);
  // Bring the table into view whenever it becomes your move (vital on phones,
  // where the stage is often scrolled away).
  const myMove =
    g && g.active === g.me && g.phase !== "lobby" && g.phase !== "finished"
      ? `${g.phase}-${g.round}-${g.activeRole}-${g.draftIndex}`
      : g?.phase === "finished" || g?.phase === "lobby"
        ? g.phase
        : null;
  useEffect(() => {
    if (myMove)
      document
        .querySelector(".game-stage, .lobby-experience")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [myMove]);
  for (let r = 1; r <= 8; r++)
    preload(`/art/character-${r}.webp`, { as: "image" });
  const [joinName, setJoinName] = useState("");
  const [profileName] = usePreference("citadel-name");
  const [role, setRole] = useState<number | null>(null);
  const [choice, setChoice] = useState<string[]>([]);
  const [inspect, setInspect] = useState<string | null>(null);
  const [inspectCity, setInspectCity] = useState<string | null>(null);
  const [power, setPower] = useState<"ability" | "laboratory" | null>(null);
  const [settings, setSettings] = useState(false);
  const [replace, setReplace] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const moments = usePreference("citadel-moments", "on")[0] !== "off";
  if (error)
    return (
      <main className="game-error">
        <Castle size={40} />
        <h1>A little detour.</h1>
        <p>{error}</p>
        <Link href="/" className="inline-link">
          Return to the great hall
          <ArrowRight size={15} />
        </Link>
      </main>
    );
  if (join)
    return (
      <main className="game-error">
        <Crown size={40} />
        <p className="eyebrow justify-center">YOUR INVITATION TO THE REALM</p>
        <h1>{join.name}</h1>
        <p>
          {join.joinable
            ? `${join.players} ${join.players === 1 ? "player is" : "players are"} waiting at the table. There’s a seat for you.`
            : "This table is already playing or full. Create your own table to start a new story."}
        </p>
        {join.joinable ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name =
                joinName.trim() || profileName.trim() || "New adventurer";
              savePreference("citadel-name", name);
              void send({ type: "join", name });
            }}
          >
            <label className="field-label" htmlFor="join-name">
              Your display name
            </label>
            <Input
              id="join-name"
              placeholder={profileName || "What shall we call you?"}
              maxLength={24}
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              Take my seat
              <ArrowRight />
            </Button>
          </form>
        ) : (
          <Link href="/" className="inline-link">
            Create a new table
            <ArrowRight size={15} />
          </Link>
        )}
      </main>
    );
  if (!g)
    return (
      <div className="table-loading">
        <LoaderCircle size={28} className="animate-spin" />
        {connected
          ? "Preparing your table…"
          : "Reconnecting to your saved game…"}
      </div>
    );
  const me = g.players.find((p) => p.id === g.me)!;
  const mine = g.active === g.me;
  const active = g.players.find((p) => p.id === g.active);
  const choices = choice.filter((c) => g.choices.includes(c));
  const selectedRole = role && g.available.includes(role) ? role : null;
  const handSorted = [...me.hand].sort(
    (a, b) => district(a).cost - district(b).cost,
  );
  return (
    <main className={`table-content ${g.phase === "lobby" ? "lobby-content" : ""}`}>
      <div className="table-header">
        <div>
          <p className="eyebrow">
            {g.phase === "lobby"
              ? "THE GATHERING"
              : g.phase === "finished"
                ? "A LEGACY WRITTEN IN STONE"
                : `CHAPTER ${String(g.round).padStart(2, "0")} · CLASSIC CITADELS`}
          </p>
          <h1>{g.name}</h1>
        </div>
        <div className="table-header-actions">
          <span className="online-state">
            <span className="status-dot" />
            {connected ? "Table connected" : "Reconnecting"}
          </span>
          <span className="room-code">{code}</span>
          <PlayerAid g={g} />
          <Button
            variant="outline"
            onClick={() => copyInvite(code)}
            aria-label="Copy invite link"
          >
            <Copy size={13} />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button
            variant="outline"
            aria-label="Table settings"
            onClick={() => {
              setSound(localStorage.getItem("citadel-sound") === "true");
              setSettings(true);
            }}
          >
            <Settings2 size={14} />
          </Button>
        </div>
      </div>
      {!connected && (
        <div className="reconnect-banner">
          Connection interrupted. Your game is saved; reconnecting
          automatically.
        </div>
      )}
      {g.phase === "lobby" ? (
        <Lobby
          g={g}
          send={send}
          busy={busy}
          online={online}
          reactions={reactions}
          react={react}
        />
      ) : (
        <>
          {g.firstComplete && g.phase !== "finished" && (
            <div className="final-round">
              <Flag size={15} />
              The final round! Finish your turn and make every district count.
            </div>
          )}
          <div className="table-layout">
            <div className="table-main">
              <SeatStrip
                g={g}
                online={online}
                reactions={reactions}
                onInspect={setInspectCity}
              />
              <div className="round-tracker">
                <span>ROUND {String(g.round).padStart(2, "0")}</span>
                <div className="role-track">
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((r) => (
                    <span
                      key={r}
                      title={character(r).name}
                      className={`${g.activeRole === r ? "current" : g.activeRole > r ? "done" : ""} ${g.killed === r ? "killed" : ""}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <span>{g.deckCount} CARDS IN DECK</span>
              </div>
              <section className="game-stage" aria-label="Game table">
                {g.phase === "finished" ? (
                  <>
                    <div className="results-head">
                      <Crown />
                      <p className="eyebrow justify-center">
                        THE REALM HAS SPOKEN
                      </p>
                      <h2>
                        {g.winnerIds.includes(g.me)
                          ? "The crown is yours."
                          : `${g.players
                              .filter((p) => g.winnerIds.includes(p.id))
                              .map((p) => p.name)
                              .join(
                                " & ",
                              )} ${g.winnerIds.length > 1 ? "share" : "takes"} the crown.`}
                      </h2>
                      <p>
                        A game of {g.round} rounds. A city worth remembering.
                      </p>
                    </div>
                    {[...g.players]
                      .sort(
                        (a, b) =>
                          b.score.total - a.score.total ||
                          b.score.districts - a.score.districts ||
                          b.gold - a.gold,
                      )
                      .map((p, i) => (
                        <div
                          key={p.id}
                          className={`result-row ${g.winnerIds.includes(p.id) ? "winner" : ""}`}
                        >
                          <span className="result-rank">{i + 1}</span>
                          <span className="result-name">
                            <strong>
                              {p.name}
                              {p.id === g.me ? " (you)" : ""}
                            </strong>
                            <small>
                              {p.score.districts} districts +{" "}
                              {p.score.diversity} diversity +{" "}
                              {p.score.completion} completion +{" "}
                              {p.score.special} special
                            </small>
                          </span>
                          <span className="result-score">
                            {p.score.total}
                            <small>POINTS</small>
                          </span>
                        </div>
                      ))}
                    {g.series && g.series.games > 0 && (
                      <p className="series-line">
                        <Trophy size={13} />
                        Before this game:{" "}
                        {g.players
                          .map((p) => `${p.name} ${g.series!.wins[p.id] ?? 0}`)
                          .join(" · ")}
                      </p>
                    )}
                    <div className="results-actions">
                      {!g.archived && (
                        <Button
                          disabled={busy}
                          onClick={() => send({ type: "rematch" })}
                        >
                          <RotateCcw />
                          Play again, same table
                        </Button>
                      )}
                      {!g.archived && g.host === g.me && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => send({ type: "reopen" })}
                        >
                          <DoorOpen />
                          Back to lobby so friends can join
                        </Button>
                      )}
                      <Link href="/" className="inline-link">
                        Back home
                      </Link>
                    </div>
                  </>
                ) : g.phase === "draft" && mine ? (
                  <>
                    <div className="stage-heading">
                      <div>
                        <p className="eyebrow">
                          {g.draftDiscard
                            ? "A SECRET LEFT BEHIND"
                            : "A NEW ROUND. A NEW IDENTITY."}
                        </p>
                        <h2>
                          {g.draftDiscard
                            ? "Set one character aside."
                            : "Who will you be?"}
                        </h2>
                        <p>
                          {g.draftDiscard
                            ? "This character will be unavailable for the rest of the draft."
                            : "Choose your character for this round. Your rivals won’t know until your turn."}
                        </p>
                      </div>
                      <ShieldCheck
                        size={22}
                        className="text-[#92a57c] shrink-0"
                      />
                    </div>
                    <div className="draft-cards">
                      {g.available.map((r) => (
                        <CharacterCard
                          key={r}
                          id={r}
                          onClick={() => setRole(r)}
                          selected={selectedRole === r}
                          disabled={busy}
                        />
                      ))}
                    </div>
                    <div className="draft-confirm">
                      <p>
                        {selectedRole ? (
                          <>
                            <strong>{character(selectedRole).name}</strong>
                            <small>{character(selectedRole).hint}</small>
                          </>
                        ) : (
                          "Select a character to make your move."
                        )}
                      </p>
                      <Button
                        disabled={busy || !selectedRole}
                        onClick={async () => {
                          if (
                            selectedRole &&
                            (await send({
                              type: g.draftDiscard ? "discard-role" : "draft",
                              role: selectedRole,
                            }))
                          )
                            setRole(null);
                        }}
                      >
                        {g.draftDiscard
                          ? "Set character aside"
                          : "Choose character"}
                        <ArrowRight />
                      </Button>
                    </div>
                  </>
                ) : g.choices.length > 0 && mine ? (
                  <>
                    <div className="stage-heading">
                      <div>
                        <p className="eyebrow">NEW POSSIBILITIES</p>
                        <h2>A blueprint for your next move.</h2>
                        <p>
                          Keep {Math.min(g.keepCount, g.choices.length)}{" "}
                          {g.keepCount === 1 ? "card" : "cards"}. The rest
                          return to the bottom of the deck.
                        </p>
                      </div>
                    </div>
                    <div className="draft-cards">
                      {g.choices.map((c) => (
                        <DistrictCard
                          key={c}
                          card={c}
                          selected={choices.includes(c)}
                          onClick={() =>
                            setChoice(
                              choices.includes(c)
                                ? choices.filter((x) => x !== c)
                                : g.keepCount === 1
                                  ? [c]
                                  : choices.length < g.keepCount
                                    ? [...choices, c]
                                    : choices,
                            )
                          }
                        />
                      ))}
                    </div>
                    <div className="draft-confirm">
                      <p>
                        {choices.length} of{" "}
                        {Math.min(g.keepCount, g.choices.length)} selected
                      </p>
                      <Button
                        disabled={
                          busy ||
                          choices.length !==
                            Math.min(g.keepCount, g.choices.length)
                        }
                        onClick={async () => {
                          if (await send({ type: "keep", cards: choices }))
                            setChoice([]);
                        }}
                      >
                        Keep selected cards
                        <Check />
                      </Button>
                    </div>
                  </>
                ) : g.phase === "turn" && mine ? (
                  <YourTurn g={g} busy={busy} send={send} onPower={setPower} />
                ) : (
                  <Waiting g={g} online={online} />
                )}
              </section>
              <section className="hand-section">
                <div className="hand-heading">
                  <h2>
                    Your hand <span>{me.handCount}</span>
                  </h2>
                  <span>
                    <ShieldCheck size={11} />
                    Only you can see these
                  </span>
                </div>
                <div className="hand-cards">
                  {handSorted.map((c) => (
                    <DistrictCard
                      key={c}
                      card={c}
                      compact
                      onClick={() => setInspect(c)}
                      badge={handBadge(g, me, c)}
                    />
                  ))}
                </div>
                {!me.hand.length && (
                  <div className="hint-box">
                    <Layers3 size={15} />
                    Your hand is empty. Gather cards on your next turn to plan
                    your next district.
                  </div>
                )}
              </section>
              <section className="city-section">
                <div className="hand-heading">
                  <h2>
                    Your city <span>{me.city.length}</span>
                  </h2>
                  <div
                    className="city-progress"
                    aria-label={`${me.city.length} of ${g.target} districts built`}
                  >
                    {Array.from({ length: g.target }, (_, i) => (
                      <span
                        key={i}
                        className={i < me.city.length ? "filled" : ""}
                      />
                    ))}
                  </div>
                </div>
                <div className="city-grid">
                  {me.city.map((c) => (
                    <DistrictCard
                      key={c}
                      card={c}
                      compact
                      onClick={() => setInspect(c)}
                    />
                  ))}
                  {me.city.length < g.target && (
                    <div className="city-slot">
                      <Castle size={22} strokeWidth={1} />
                      <span>{g.target - me.city.length} TO COMPLETE</span>
                    </div>
                  )}
                </div>
              </section>
              <div className="mobile-journal">
                <ReactionBar send={react} />
                <Journal g={g} send={send} busy={busy} />
              </div>
            </div>
            <aside className="table-aside">
              <ActionPanel g={g} busy={busy} send={send} onPower={setPower} />
              <ReactionBar send={react} />
              <Journal g={g} send={send} busy={busy} />
            </aside>
          </div>
        </>
      )}
      <Moments g={g} />
      <div className="sr-live" role="status" aria-live="polite">
        {mine ? "It is your turn." : `${active?.name} is playing.`}{" "}
        {g.log.at(-1)?.text}
      </div>
      {inspect && (
        <InspectDialog
          g={g}
          card={inspect}
          busy={busy}
          send={send}
          close={() => setInspect(null)}
        />
      )}{" "}
      {inspectCity && (
        <CityDialog
          g={g}
          id={inspectCity}
          close={() => setInspectCity(null)}
          inspect={setInspect}
        />
      )}{" "}
      {power && g.active === g.me && g.phase === "turn" && (
        <PowerDialog
          key={`${g.round}-${g.activeRole}-${power}`}
          g={g}
          kind={power}
          busy={busy}
          send={send}
          close={() => setPower(null)}
        />
      )}
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A table that feels like yours.</DialogTitle>
            <DialogDescription>
              Your progress is saved after every move. Leave and return to this
              link whenever you like.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.setItem("citadel-sound", String(!sound));
              setSound(!sound);
              window.dispatchEvent(new Event("citadel-sound"));
            }}
          >
            {sound ? <Volume2 /> : <VolumeX />}Turn notification sound:{" "}
            {sound ? "on" : "off"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              savePreference("citadel-moments", moments ? "off" : "on")
            }
          >
            <Sparkles />
            Big moments (reveals, murders): {moments ? "on" : "off"}
          </Button>
          <Link href="/how-to-play" target="_blank" className="inline-link">
            <BookOpen size={15} />
            Open the field guide
            <ArrowRight size={14} />
          </Link>
          {g.host === g.me &&
            g.phase !== "lobby" &&
            g.phase !== "finished" &&
            g.players.some(
              (p) => p.id !== g.me && !p.bot && !online.has(p.id),
            ) && (
              <>
                <p className="text-[11px] text-muted-foreground">
                  A friend has left? Autopilot plays their seat so the rest of
                  you can finish. It can’t be undone.
                </p>
                {g.players
                  .filter((p) => p.id !== g.me && !p.bot && !online.has(p.id))
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant="outline"
                      onClick={() => setReplace(p.id)}
                    >
                      <Bot />
                      Put {p.name} on autopilot
                    </Button>
                  ))}
              </>
            )}
          <Link href="/" className="inline-link">
            Return to the great hall
            <ArrowRight size={14} />
          </Link>
        </DialogContent>
      </Dialog>
      <Dialog
        open={replace !== null}
        onOpenChange={(v) => {
          if (!v) setReplace(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Put this seat on autopilot?</DialogTitle>
            <DialogDescription>
              The table will play simple moves for{" "}
              {g.players.find((p) => p.id === replace)?.name} so the game can
              finish. They won’t be able to take this seat back.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={async () => {
              if (
                replace &&
                (await send({ type: "replace", target: replace }))
              ) {
                setReplace(null);
                setSettings(false);
              }
            }}
            disabled={busy}
          >
            Turn on autopilot
          </Button>
          <Button variant="outline" onClick={() => setReplace(null)}>
            Keep their seat
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Waiting({ g, online }: { g: GameView; online: Set<string> }) {
  const now = useNow(1000);
  const p = g.players.find((p) => p.id === g.active)!;
  const Icon = g.activeRole ? ROLE_ICONS[g.activeRole - 1] : Crown;
  const me = g.players.find((x) => x.id === g.me)!;
  const draft = g.phase === "draft";
  return (
    <div className="waiting-stage">
      <span className="waiting-avatar">
        <Avatar id={p.id} name={p.name} online={online.has(p.id)} size={64} />
        <span className="waiting-badge">
          <Icon size={15} strokeWidth={1.5} />
        </span>
      </span>
      <p className="eyebrow">
        {draft
          ? "CHOOSING IN SECRET"
          : g.phase === "recovery"
            ? "THE GRAVEYARD"
            : `THE ${character(g.activeRole).name.toUpperCase()}’S TURN`}
      </p>
      <h2>
        {p.name} is {draft ? "picking a character…" : "making their move…"}
      </h2>
      {g.turnAt && <p className="waiting-timer">{clock(now - g.turnAt)}</p>}
      <p>
        {draft
          ? me.roles.length
            ? `You’re the ${me.roles.map((r) => character(r).name).join(" & ")}. Keep a straight face.`
            : "They’ll pass the remaining characters along. Your pick is coming."
          : me.roles.some((r) => r > g.activeRole && !me.revealed.includes(r))
            ? `Your ${me.roles
                .filter((r) => r > g.activeRole && !me.revealed.includes(r))
                .map((r) => character(r).name)
                .join(
                  " & ",
                )} will be called soon. Plan your build from your hand below.`
            : "Watch their city. Tap any player above to see what they’ve built."}
      </p>
      <div className="waiting-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function buildsLeft(g: GameView) {
  return Math.max(0, (g.activeRole === 7 ? 3 : 1) - g.builds);
}
function handBadge(g: GameView, me: GameView["players"][number], c: string) {
  if (me.city.some((x) => district(x).id === district(c).id))
    return "Already in your city";
  if (g.phase !== "turn" || g.active !== g.me || !g.gathered) return undefined;
  if (!buildsLeft(g)) return undefined;
  return district(c).cost <= me.gold
    ? "Tap to build"
    : `Need ${district(c).cost - me.gold} more gold`;
}
function YourTurn({
  g,
  busy,
  send,
  onPower,
}: {
  g: GameView;
  busy: boolean;
  send: (a: GameAction) => Promise<boolean>;
  onPower: (kind: "ability" | "laboratory") => void;
}) {
  const me = g.players.find((p) => p.id === g.me)!;
  const role = character(g.activeRole);
  const left = buildsLeft(g);
  const affordable = me.hand.filter(
    (c) =>
      district(c).cost <= me.gold &&
      !me.city.some((x) => district(x).id === district(c).id),
  );
  const hasPower = [1, 2, 3, 8].includes(role.id) && !g.abilityUsed;
  return (
    <div className="your-turn">
      <div className="stage-heading">
        <div>
          <p className="eyebrow">YOUR TURN · THE {role.name.toUpperCase()}</p>
          <h2>
            {g.gathered ? "Now, build your city." : "First, take an action."}
          </h2>
        </div>
        <Coins size={25} className="text-[#af995f] shrink-0" />
      </div>
      <ol className="turn-guide">
        <li className={g.gathered ? "done" : "current"}>
          <span>{g.gathered ? <Check size={14} /> : 1}</span>
          <div>
            <b>Take an action</b>
            {g.gathered ? (
              <p>Done.</p>
            ) : (
              <div className="turn-choice">
                <Button disabled={busy} onClick={() => send({ type: "gold" })}>
                  <Coins />
                  Take 2 gold
                </Button>
                <Button
                  variant="outline"
                  disabled={busy || g.deckCount === 0}
                  onClick={() => send({ type: "draw" })}
                >
                  <Layers3 />
                  Draw 2 cards, keep 1
                </Button>
              </div>
            )}
          </div>
        </li>
        <li className={!g.gathered ? "" : left ? "current" : "done"}>
          <span>{g.gathered && !left ? <Check size={14} /> : 2}</span>
          <div>
            <b>
              Build {g.activeRole === 7 ? "up to 3 districts" : "one district"}{" "}
              <small>(optional)</small>
            </b>
            <p>
              {!g.gathered
                ? `You have ${me.gold} gold. Building costs the number on the card.`
                : !left
                  ? "You’ve built all you can this turn."
                  : affordable.length
                    ? `You have ${me.gold} gold. Tap a card marked “Tap to build” in your hand below.`
                    : `You have ${me.gold} gold. Nothing in your hand is affordable yet, so save up for next turn.`}
            </p>
          </div>
        </li>
        {hasPower && (
          <li className="power">
            <span>
              <Sparkles size={13} />
            </span>
            <div>
              <b>Your power (any time this turn)</b>
              <p>{role.description}</p>
              <Button
                variant="outline"
                size="sm"
                disabled={busy || g.choices.length > 0}
                onClick={() => onPower("ability")}
              >
                <Sparkles />
                {role.id === 1
                  ? "Choose who to assassinate"
                  : role.id === 2
                    ? "Choose who to rob"
                    : role.id === 3
                      ? "Swap cards"
                      : "Destroy a district"}
              </Button>
            </div>
          </li>
        )}
        <li className={g.gathered ? "current" : ""}>
          <span>{hasPower ? 4 : 3}</span>
          <div>
            <b>End your turn</b>
            {g.gathered ? (
              <Button disabled={busy} onClick={() => send({ type: "end" })}>
                End my turn
                <ArrowRight />
              </Button>
            ) : (
              <p>Available after you take an action.</p>
            )}
          </div>
        </li>
      </ol>
      <div className="hint-box">
        <Lightbulb size={15} />
        <span>{role.hint}</span>
      </div>
    </div>
  );
}
