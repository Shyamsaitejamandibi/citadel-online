"use client";
import {
  Bot,
  Crown,
  Users,
  Plus,
  Copy,
  Check,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GameAction, GameView } from "@/lib/game/types";
import { toast } from "sonner";
export async function copyInvite(code: string) {
  try {
    await navigator.clipboard.writeText(
      `${window.location.origin}/play/${code}`,
    );
    toast.success("Invite link copied. Send it to your friends.");
    return true;
  } catch {
    toast.error(`Share this code with your friends: ${code}`);
    return false;
  }
}
export function Lobby({
  g,
  busy,
  send,
}: {
  g: GameView;
  busy: boolean;
  send: (a: GameAction) => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const host = g.me === g.host;
  return (
    <>
      <div className="lobby-hero">
        <p className="hero-kicker">A NEW STORY IS ABOUT TO BEGIN</p>
        <h2>
          There’s room for
          <br />
          <em>a little friendly rivalry.</em>
        </h2>
        <p>Invite your friends. Fill the spare seats. Make an evening of it.</p>
      </div>
      <div className="lobby-layout">
        <section className="lobby-seats">
          <h3>
            A place at the table{" "}
            <span className="text-sm text-muted-foreground">
              {g.players.length}/7
            </span>
          </h3>
          {g.players.map((p) => (
            <div key={p.id} className="lobby-seat">
              <span className="seat-avatar">
                {p.bot ? <Bot size={18} /> : <Crown size={18} />}
              </span>
              <span>
                {p.name}
                {p.id === g.me ? " (you)" : ""}
                <small>
                  {p.bot
                    ? "Computer rival"
                    : p.id === g.host
                      ? "Host · ready to play"
                      : "Ready to play"}
                </small>
              </span>
              {p.id === g.host ? (
                <Crown size={15} className="text-amber-700" />
              ) : p.bot && host ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${p.name}`}
                  disabled={busy}
                  onClick={() => send({ type: "remove-bot", target: p.id })}
                >
                  <X size={14} />
                </Button>
              ) : (
                <Check size={15} />
              )}
            </div>
          ))}
          {host && g.players.length < 7 && (
            <Button
              className="w-full mt-5"
              variant="outline"
              disabled={busy}
              onClick={() => send({ type: "add-bot" })}
            >
              <Plus />
              Add a computer rival
            </Button>
          )}
        </section>
        <section className="lobby-details">
          <ShieldCheck size={24} className="mb-4 text-[#85996e]" />
          <h3>Just you and your people.</h3>
          <p>
            This is a private table. Share the link or invite code with anyone
            you’d like to join.
          </p>
          <div className="invite-code-box">
            <span>{g.code}</span>
            <Button
              variant="ghost"
              aria-label="Copy invite link"
              onClick={async () => {
                setCopied(await copyInvite(g.code));
              }}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <div className="score-line">
            <span>
              <Users size={13} className="inline mr-2" />
              Players
            </span>
            <span>2–7</span>
          </div>
          <div className="score-line">
            <span>Characters</span>
            <span>Classic eight</span>
          </div>
          <div className="score-line">
            <span>City completion</span>
            <span>{g.target} districts</span>
          </div>
          <div className="lobby-start">
            {host ? (
              <Button
                disabled={busy || g.players.length < 2}
                onClick={() => send({ type: "start" })}
              >
                Begin our story
                <ArrowRight />
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Your host will start when everyone is ready.
              </p>
            )}
            <span className="text-[9px] text-muted-foreground text-center">
              {g.players.length < 2
                ? "Add a rival or invite a friend to begin."
                : "No timers. No rush. Enjoy the game."}
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
