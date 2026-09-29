"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Crown,
  Castle,
  Coins,
  Layers3,
  Bot,
  Copy,
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
} from "lucide-react";
import { useGame } from "@/lib/game/use-game";
import { character, district } from "@/lib/game/catalog";
import { GameView } from "@/lib/game/types";
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
export function GameTable({ code }: { code: string }) {
  const { game: g, join, error, connected, busy, send } = useGame(code);
  const [joinName, setJoinName] = useState("");
  const [role, setRole] = useState<number | null>(null);
  const [choice, setChoice] = useState<string[]>([]);
  const [inspect, setInspect] = useState<string | null>(null);
  const [inspectCity, setInspectCity] = useState<string | null>(null);
  const [power, setPower] = useState<"ability" | "laboratory" | null>(null);
  const [settings, setSettings] = useState(false);
  const [replace, setReplace] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
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
              const name = joinName.trim() || "New adventurer";
              localStorage.setItem("citadel-name", name);
              void send({ type: "join", name });
            }}
          >
            <label className="field-label" htmlFor="join-name">
              Your display name
            </label>
            <Input
              id="join-name"
              placeholder="What shall we call you?"
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
    <main className="table-content">
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
        <Lobby g={g} send={send} busy={busy} />
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
              <div
                className="player-strip"
                style={{ "--players": g.players.length } as React.CSSProperties}
              >
                {g.players.map((p) => (
                  <button
                    key={p.id}
                    className={`player-seat ${g.active === p.id && g.phase !== "finished" ? "current" : ""}`}
                    onClick={() => setInspectCity(p.id)}
                    aria-label={`Inspect ${p.name}’s city`}
                  >
                    <div className="seat-top">
                      <span className="seat-avatar">
                        {p.bot ? <Bot size={15} /> : <ShieldCheck size={15} />}
                      </span>
                      <span>{p.id === g.me ? "You" : p.name}</span>
                      {p.id === g.crown && <Crown size={12} />}
                    </div>
                    <div className="seat-stats">
                      <span>
                        <Coins size={11} />
                        {p.gold}
                      </span>
                      <span>
                        <Castle size={11} />
                        {p.city.length}
                      </span>
                      <span>
                        <Layers3 size={11} />
                        {p.handCount}
                      </span>
                    </div>
                    <span className="seat-role">
                      {p.revealed.length
                        ? p.revealed.map((r) => character(r).name).join(" · ")
                        : "Character hidden"}
                    </span>
                  </button>
                ))}
              </div>
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
                    <div className="results-actions">
                      {g.host === g.me && !g.archived && (
                        <Button
                          disabled={busy}
                          onClick={() => send({ type: "rematch" })}
                        >
                          Another round of rivalry
                          <ArrowRight />
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
                  <>
                    <div className="stage-heading">
                      <div>
                        <p className="eyebrow">YOUR MOMENT TO SHAPE THE CITY</p>
                        <h2>
                          {g.gathered
                            ? "Lay the foundations of a legacy."
                            : "Every ambition starts somewhere."}
                        </h2>
                        <p>
                          {g.gathered
                            ? `You have ${me.gold} gold and can build ${Math.max(0, (g.activeRole === 7 ? 3 : 1) - g.builds)} more ${g.activeRole === 7 && g.builds < 2 ? "districts" : "district"} this turn. Select a card in your hand below.`
                            : "Gather two gold or draw district cards using your action panel. You can also use your character’s special power."}
                        </p>
                      </div>
                      <Coins size={25} className="text-[#af995f] shrink-0" />
                    </div>
                    <div className="city-grid">
                      {me.city.slice(-4).map((c) => (
                        <DistrictCard
                          key={c}
                          card={c}
                          compact
                          onClick={() => setInspect(c)}
                        />
                      ))}
                      {Array.from(
                        { length: Math.max(0, 4 - me.city.length) },
                        (_, i) => (
                          <div key={i} className="city-slot">
                            <Castle size={24} strokeWidth={1} />
                            <span>ROOM TO DREAM</span>
                          </div>
                        ),
                      )}
                    </div>
                    <div className="hint-box">
                      <Lightbulb size={15} />
                      <span>
                        {character(g.activeRole).hint}{" "}
                        {g.activeRole === 7
                          ? "As the Architect, you can build three districts this turn."
                          : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <Waiting g={g} />
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
                <Journal g={g} send={send} busy={busy} />
              </div>
            </div>
            <aside className="table-aside">
              <ActionPanel g={g} busy={busy} send={send} onPower={setPower} />
              <Journal g={g} send={send} busy={busy} />
            </aside>
          </div>
        </>
      )}
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
          <Link href="/how-to-play" target="_blank" className="inline-link">
            <BookOpen size={15} />
            Open the field guide
            <ArrowRight size={14} />
          </Link>
          {g.host === g.me &&
            g.phase !== "lobby" &&
            g.phase !== "finished" &&
            g.players.some((p) => p.id !== g.me && !p.bot) && (
              <>
                <p className="text-[11px] text-muted-foreground">
                  If a friend leaves, a computer can finish their game. Their
                  seat cannot be reclaimed afterward.
                </p>
                {g.players
                  .filter((p) => p.id !== g.me && !p.bot)
                  .map((p) => (
                    <Button
                      key={p.id}
                      variant="outline"
                      onClick={() => setReplace(p.id)}
                    >
                      <Bot />
                      Replace {p.name} with a rival
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
            <DialogTitle>Hand this seat to a rival?</DialogTitle>
            <DialogDescription>
              A computer will take over for{" "}
              {g.players.find((p) => p.id === replace)?.name}. Your friend will
              no longer be able to play this seat.
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
            Confirm replacement
          </Button>
          <Button variant="outline" onClick={() => setReplace(null)}>
            Keep their seat
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Waiting({ g }: { g: GameView }) {
  const p = g.players.find((p) => p.id === g.active)!;
  const Icon = g.activeRole ? ROLE_ICONS[g.activeRole - 1] : Crown;
  return (
    <div className="waiting-stage">
      <span className="waiting-icon">
        <Icon size={28} strokeWidth={1.2} />
      </span>
      <p className="eyebrow">
        {g.phase === "draft"
          ? "THE ART OF KEEPING SECRETS"
          : "THE CITY NEVER STANDS STILL"}
      </p>
      <h2>
        {p.name} is {g.phase === "draft" ? "choosing." : "making a move."}
      </h2>
      <p>
        {g.phase === "draft"
          ? "A new identity. A new plan. A little patience while your rivals make their choices."
          : "Study the cities around you. Your next great move might be hiding in plain sight."}
      </p>
      <div className="waiting-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
