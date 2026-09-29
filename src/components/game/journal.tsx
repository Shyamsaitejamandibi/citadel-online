"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameView, GameAction } from "@/lib/game/types";
export function Journal({
  g,
  send,
  busy,
}: {
  g: GameView;
  send: (a: GameAction) => Promise<boolean>;
  busy: boolean;
}) {
  const [tab, setTab] = useState("journal");
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [g.log.length, tab]);
  return (
    <section className="journal">
      <div className="journal-tabs">
        <button
          className={tab === "journal" ? "active" : ""}
          onClick={() => setTab("journal")}
        >
          Game journal
        </button>
        <button
          className={tab === "chat" ? "active" : ""}
          onClick={() => setTab("chat")}
        >
          Table talk
        </button>
      </div>
      <div
        className="journal-entries"
        ref={ref}
        aria-label={tab === "journal" ? "Game journal" : "Table chat"}
      >
        {tab === "journal" ? (
          g.log
            .filter((l) => l.kind !== "chat")
            .map((l, i, all) => (
              <div key={l.id} className={`journal-entry kind-${l.kind}`}>
                {(!i || all[i - 1].round !== l.round) && (
                  <span className="log-round">ROUND {l.round}</span>
                )}
                {l.text}
              </div>
            ))
        ) : g.log.filter((l) => l.kind === "chat").length ? (
          g.log
            .filter((l) => l.kind === "chat")
            .map((l) => (
              <div className="chat-message" key={l.id}>
                <strong>
                  {g.players.find((p) => p.id === l.player)?.name}
                </strong>
                {l.text}
              </div>
            ))
        ) : (
          <p className="text-[10px] leading-6 text-muted-foreground">
            A little table talk makes a better rivalry. Say hello to your fellow
            city builders.
          </p>
        )}
      </div>
      {tab === "chat" && (
        <form
          className="chat-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await send({ type: "chat", text: message })) setMessage("");
          }}
        >
          <Input
            aria-label="Message to the table"
            placeholder="A word to the table…"
            value={message}
            maxLength={240}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            type="submit"
            disabled={busy || !message.trim()}
            aria-label="Send message"
          >
            <Send size={14} />
          </Button>
        </form>
      )}
    </section>
  );
}
