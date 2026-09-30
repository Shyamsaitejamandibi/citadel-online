"use client";

import {
  ArrowRight,
  Bot,
  Castle,
  Check,
  Copy,
  Crown,
  LogOut,
  Share2,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { GameAction, GameView } from "@/lib/game/types";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import type { LiveReaction } from "@/lib/game/use-table-life";

export async function copyInvite(code: string) {
  const url = `${window.location.origin}/play/${code}`;
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({
        title: "Join my Citadels table",
        text: `Come play Citadels with me! Code ${code}`,
        url,
      });
      return true;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied. Send it to your friends.");
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return false;
    toast.error(`Share this code with your friends: ${code}`);
    return false;
  }
}

export function Lobby({
  g,
  busy,
  send,
  online,
  reactions,
}: {
  g: GameView;
  busy: boolean;
  send: (a: GameAction) => Promise<boolean>;
  online: Set<string>;
  reactions: LiveReaction[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const host = g.me === g.host;
  const humans = g.players.filter((p) => !p.bot);
  const me = g.players.find((p) => p.id === g.me)!;
  const readyCount = humans.filter((p) => p.ready).length;
  // Keep test bots available online until the owner signs off on release.
  const testBots = process.env.NEXT_PUBLIC_ENABLE_BOTS !== "false";
  const hasPlayers = testBots ? g.players.length >= 2 : humans.length >= 2;
  const canStart = hasPlayers && humans.every((p) => p.ready);
  const empty = Math.max(0, 7 - g.players.length);
  const hostName = g.players.find((p) => p.id === g.host)?.name ?? "The host";
  const series = g.series;
  const invite = async () => setCopied(await copyInvite(g.code));

  return (
    <section className="lobby-experience" aria-label="Your Citadels lobby">
      <div className="lobby-intro">
        <div>
          <p className="lobby-overline">
            <span className="live-spark" /> PRIVATE TABLE · {g.players.length}{" "}
            OF 7 SEATS TAKEN
          </p>
          <h2>
            {humans.length < 2 ? (
              <>
                The table is set. <em>Bring your people.</em>
              </>
            ) : (
              <>
                The company is here. <em>Let the intrigue begin.</em>
              </>
            )}
          </h2>
          <p className="lobby-intro-copy">
            Every crown has a story. Yours starts with the people around this
            table.
          </p>
        </div>
        <div
          className="lobby-intro-count"
          aria-label={`${g.players.length} of 7 players`}
        >
          <Users size={20} />
          <strong>
            {g.players.length}
            <span>/7</span>
          </strong>
          <small>AT THE TABLE</small>
        </div>
      </div>

      <div className="lobby-layout">
        <div className="lobby-room">
          <div className="lobby-room-heading">
            <span>
              <Sparkles size={14} /> THE GATHERING
            </span>
            <span>
              CHAPTER {String((series?.games ?? 0) + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="lobby-table-scene">
            <div className="lobby-tabletop" aria-hidden="true">
              <div className="tabletop-engraving" />
              <div className="tabletop-center">
                <Castle size={28} strokeWidth={1.3} />
                <span>CITADELS</span>
                <small>THE CITY IS YOURS TO BUILD</small>
              </div>
              <div className="tabletop-cards">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="lobby-table-seats">
              {g.players.map((p, i) => (
                <div
                  key={p.id}
                  className={`lobby-table-seat lobby-seat position-${i + 1} ${online.has(p.id) || p.bot ? "" : "is-away"} ${p.id === g.me ? "is-you" : ""}`}
                >
                  <span className="seat-reactions" aria-hidden>
                    {reactions
                      .filter((r) => r.player === p.id)
                      .map((r) => (
                        <i key={r.id}>{r.emoji}</i>
                      ))}
                  </span>
                  <Avatar
                    id={p.id}
                    name={p.name}
                    online={p.bot ? undefined : online.has(p.id)}
                    size={52}
                  />
                  <span className="lobby-seat-name">
                    <strong>
                      {p.name}
                      {p.id === g.me ? " (you)" : ""}
                    </strong>
                    <small>
                      {p.bot
                        ? "Test bot"
                        : p.ready
                          ? "Ready to play ✓"
                          : online.has(p.id)
                            ? "Getting settled"
                            : "Stepped away"}
                    </small>
                  </span>
                  {p.id === g.host ? (
                    <Crown size={14} className="seat-crown" aria-label="Host" />
                  ) : host ? (
                    <button
                      className="seat-remove"
                      aria-label={`Remove ${p.name} from the table`}
                      disabled={busy}
                      onClick={() =>
                        send({
                          type: p.bot ? "remove-bot" : "kick",
                          target: p.id,
                        })
                      }
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              ))}
              {Array.from({ length: empty }, (_, i) => (
                <button
                  key={i}
                  className={`lobby-table-seat lobby-seat position-${g.players.length + i + 1} vacant`}
                  onClick={invite}
                  aria-label={`Invite a friend to empty seat ${g.players.length + i + 1}`}
                >
                  <span className="vacant-avatar">
                    <UserPlus size={17} />
                  </span>
                  <span className="lobby-seat-name">
                    <strong>Open seat</strong>
                    <small>Invite a friend</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="lobby-room-bottom">
            <div className="lobby-ready-check">
              <span>
                <Check size={16} />
                <strong>
                  {readyCount}/{humans.length}
                </strong>{" "}
                players ready
              </span>
              <Button
                variant={me.ready ? "outline" : "default"}
                disabled={busy}
                aria-pressed={!!me.ready}
                onClick={() => send({ type: "ready", ready: !me.ready })}
              >
                <Check size={16} />
                {me.ready ? "Ready · click to undo" : "I’m ready to play"}
              </Button>
            </div>
            {testBots && host && g.players.length < 7 && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => send({ type: "add-bot" })}
              >
                <Bot /> Add test bot
              </Button>
            )}
          </div>
          <div className="lobby-invitation" aria-label="Invite and game setup">
            <div className="rail-invite">
              <div className="invite-code-label">
                INVITE YOUR FRIENDS · PRIVATE CODE
              </div>
              <button
                className="invite-code-box"
                onClick={invite}
                aria-label="Copy invite link"
              >
                <span>{g.code}</span>
                {copied ? <Check size={19} /> : <Copy size={19} />}
              </button>
              <Button
                className="lobby-share"
                variant="outline"
                onClick={invite}
              >
                <Share2 size={17} />{" "}
                {copied ? "Invite link copied" : "Share invite link"}
              </Button>
            </div>
            <div className="rail-info">
              <div className="invite-code-label">THIS GAME</div>
              <div className="invitation-facts">
                <span>
                  <Users size={17} /> Players <strong>2–7</strong>
                </span>
                <span>
                  <Castle size={17} /> First to{" "}
                  <strong>{g.target} districts</strong>
                </span>
              </div>
            </div>
            <div className="lobby-start">
              {host ? (
                <>
                  <Button
                    disabled={busy || !canStart}
                    onClick={() => send({ type: "start" })}
                  >
                    {canStart
                      ? `Start the game with ${g.players.length}`
                      : hasPlayers
                        ? "Waiting for everyone to be ready"
                        : "Waiting for your first guest"}
                    <ArrowRight size={17} />
                  </Button>
                  {!canStart && (
                    <p>
                      {hasPlayers
                        ? "Each player can mark themselves ready above."
                        : "One friend is all it takes to begin."}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p>{hostName} will begin when everyone is ready.</p>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={async () => {
                      if (await send({ type: "leave" })) router.push("/");
                    }}
                  >
                    <LogOut size={16} /> Leave table
                  </Button>
                </>
              )}
            </div>
          </div>
          {series && series.games > 0 && (
            <div className="series-box lobby-series">
              <p className="eyebrow">
                <Trophy size={12} /> SCOREBOARD · {series.games}{" "}
                {series.games === 1 ? "GAME" : "GAMES"}
              </p>
              {[...g.players]
                .sort(
                  (a, b) => (series.wins[b.id] ?? 0) - (series.wins[a.id] ?? 0),
                )
                .map((p) => (
                  <div key={p.id} className="score-line">
                    <span>{p.name}</span>
                    <span>{series.wins[p.id] ?? 0}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
