"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Users,
  Bot,
  BookOpen,
  Clock3,
  Crown,
  Sparkles,
  Plus,
  Link2,
  ShieldCheck,
  LoaderCircle,
  Swords,
  Check,
  Castle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CharacterCard } from "@/components/game/character-card";
import { toast } from "sonner";
import { usePreference } from "@/lib/preferences";
type Recent = {
  code: string;
  name: string;
  phase: string;
  round: number;
  players: number;
  score: number | null;
  won: boolean;
};
export function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"solo" | "friends" | "join" | null>(null);
  const [name, setName] = usePreference("citadel-name");
  const [code, setCode] = useState("");
  const [players, setPlayers] = useState(4);
  const [target, setTarget] = useState(8);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [showAllGames, setShowAllGames] = useState(false);
  useEffect(() => {
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((d) => setRecent(d.games ?? []))
      .catch(() => {});
  }, []);
  const finished = recent.filter((g) => g.phase === "finished");
  async function create() {
    if (mode === "join") {
      const clean = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{8}$/.test(clean)) {
        toast.error("Enter the eight-character invite code.");
        return;
      }
      router.push(`/play/${clean}`);
      return;
    }
    setBusy(true);
    try {
      const displayName = name.trim() || "Aspiring ruler";
      localStorage.setItem("citadel-name", displayName);
      const r = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, mode, players, target }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      router.push(`/play/${data.code}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create a table.");
      setBusy(false);
    }
  }
  return (
    <main className="home-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            <span />
            THE CROWN IS UP FOR GRABS
          </p>
          <h1>Great cities. Greater rivalries.</h1>
          <p>Gather your people. Choose your character. Build your legacy.</p>
        </div>
        <span className="heading-seal">
          <Crown size={20} />
          <span>
            A CLASSIC,
            <br />
            REIMAGINED.
          </span>
        </span>
      </div>
      <section className="hero">
        <div className="hero-art" />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-kicker">
            <span />
            WELCOME TO CITADELS
          </span>
          <h2>
            Every great city
            <br />
            has a <em>hidden story.</em>
          </h2>
          <p>
            A game of cunning characters, magnificent cities,
            <br className="desktop-break" />
            and the friends you probably shouldn’t trust.
          </p>
          <Button className="gold-button" onClick={() => setMode("solo")}>
            <Swords size={17} />
            Let’s play
            <ArrowRight size={17} />
          </Button>
          <div className="hero-meta">
            <span>
              <Users size={14} />
              2–7 players
            </span>
            <i />
            <span>
              <Clock3 size={14} />
              20–45 min
            </span>
            <i />
            <span>No downloads. Just play.</span>
          </div>
        </div>
        <div className="hero-corner">
          <span>BUILD YOUR LEGACY</span>
          <Castle size={22} strokeWidth={1} />
          <span>ONE DISTRICT AT A TIME</span>
        </div>
      </section>
      <section className="play-section">
        <div className="section-heading">
          <h2>Your seat is ready.</h2>
          <span>A table for every kind of evening</span>
        </div>
        <div className="play-options">
          <button className="play-option" onClick={() => setMode("friends")}>
            <span className="option-icon green">
              <Users size={25} strokeWidth={1.5} />
            </span>
            <span className="option-title">
              Play with friends
              <ArrowUpRight size={19} />
            </span>
            <p>
              Your favorite people. A private table.
              <br />
              Let the friendly scheming begin.
            </p>
            <span className="option-link">
              Create a table
              <Plus size={15} />
            </span>
            <span className="option-tag">GOOD COMPANY, GREAT RIVALRIES</span>
          </button>
          <button className="play-option" onClick={() => setMode("solo")}>
            <span className="option-icon amber">
              <Bot size={25} strokeWidth={1.5} />
            </span>
            <span className="option-title">
              Practice your craft
              <ArrowUpRight size={19} />
            </span>
            <p>
              Face clever computer rivals.
              <br />
              Try a new strategy. Find your edge.
            </p>
            <span className="option-link">
              Play against the realm
              <ArrowRight size={15} />
            </span>
            <span className="option-tag">READY WHEN YOU ARE</span>
          </button>
          <Link href="/how-to-play" className="play-option learn-option">
            <span className="option-icon blue">
              <BookOpen size={25} strokeWidth={1.5} />
            </span>
            <span className="option-title">
              New to the city?
              <ArrowUpRight size={19} />
            </span>
            <p>
              A little guidance goes a long way.
              <br />
              We’ll show you around.
            </p>
            <span className="option-link">
              Learn to play
              <ArrowRight size={15} />
            </span>
            <span className="option-tag">
              EASY TO LEARN. A LIFETIME TO MASTER.
            </span>
          </Link>
        </div>
        <div className="invite-line">
          <Link2 size={15} />
          <span>Already have a seat at someone’s table?</span>
          <button onClick={() => setMode("join")}>
            Join with a code
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
      <section className="realm-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EIGHT FACES. ENDLESS POSSIBILITIES.</p>
            <h2>Who will you be this round?</h2>
          </div>
          <Link href="/collection">
            Meet the characters
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="home-characters">
          {[1, 4, 6, 7].map((id) => (
            <CharacterCard
              key={id}
              id={id}
              compact
              onClick={() => setSelectedRole(id)}
            />
          ))}
        </div>
      </section>
      <section className="home-bottom">
        <div className="recent-panel">
          <div className="section-heading">
            <h2>Your story so far</h2>
            <span>
              <Clock3 size={14} /> Saved automatically
            </span>
          </div>
          {recent.length ? (
            recent.slice(0, showAllGames ? recent.length : 3).map((g) => (
              <Link
                className="recent-game"
                key={g.code}
                href={`/play/${g.code}`}
              >
                <span className="recent-icon">
                  {g.phase === "finished" ? (
                    <Crown size={19} />
                  ) : (
                    <Castle size={19} />
                  )}
                </span>
                <span>
                  <strong>{g.name}</strong>
                  <small>
                    {g.players} players ·{" "}
                    {g.phase === "finished"
                      ? `${g.score} points`
                      : `Round ${g.round || "—"}`}
                  </small>
                </span>
                <span className="recent-state">
                  {g.phase === "finished"
                    ? g.won
                      ? "Victory"
                      : "Completed"
                    : "Continue"}
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))
          ) : (
            <div className="empty-history">
              <Crown size={28} strokeWidth={1} />
              <p>Every legacy begins with a first game.</p>
              <span>Your adventures will find a home here.</span>
            </div>
          )}
          {recent.length > 3 && (
            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => setShowAllGames(!showAllGames)}
            >
              {showAllGames
                ? "Show recent tables"
                : `View all ${recent.length} tables`}
              <ArrowRight size={13} />
            </Button>
          )}
        </div>
        <div className="legacy-panel">
          <ShieldCheck size={24} strokeWidth={1.4} />
          <h3>The table takes care of the details.</h3>
          <p>
            Private hands. Automatic scoring. A little help when you need it.
            More time for the good part.
          </p>
          <div className="legacy-stats">
            <span>
              <strong>{finished.length}</strong>games played
            </span>
            <span>
              <strong>{finished.filter((g) => g.won).length}</strong>crowns
              earned
            </span>
          </div>
        </div>
      </section>
      <div className="home-signoff">
        <Sparkles size={14} />
        <span>Some build cities. Others build legends. Which will you be?</span>
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setMode(null);
        }}
      >
        <DialogContent className="setup-dialog">
          <DialogHeader>
            <span className="dialog-emblem">
              {mode === "friends" ? (
                <Users />
              ) : mode === "join" ? (
                <Link2 />
              ) : (
                <Bot />
              )}
            </span>
            <DialogTitle>
              {mode === "friends"
                ? "Good company starts here."
                : mode === "join"
                  ? "Your friends saved you a seat."
                  : "Meet your next rivals."}
            </DialogTitle>
            <DialogDescription>
              {mode === "friends"
                ? "Create a private table and share the invite. Add computer rivals to fill any empty seats."
                : mode === "join"
                  ? "Enter the invite code from your host to find your table."
                  : "A full game with computer opponents. Take your time — your progress is always saved."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
            className="setup-form"
          >
            {mode === "join" ? (
              <>
                <label htmlFor="room-code" className="field-label">
                  Invite code
                </label>
                <Input
                  id="room-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7B2C9D4"
                  maxLength={8}
                  className="code-input"
                />
              </>
            ) : (
              <>
                <label htmlFor="display-name" className="field-label">
                  What shall we call you?
                </label>
                <Input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="Aspiring ruler"
                />
                {mode === "solo" && (
                  <>
                    <label className="field-label">
                      Seats at the table <span>including you</span>
                    </label>
                    <div className="seat-picker">
                      {[2, 3, 4, 5, 6, 7].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => setPlayers(n)}
                          aria-pressed={players === n}
                          className={players === n ? "selected" : ""}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <label className="field-label">The finish line</label>
                <div className="target-picker">
                  {[8, 7].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setTarget(n)}
                      className={target === n ? "selected" : ""}
                    >
                      <span>
                        {n === 8 ? "Classic game" : "A shorter story"}
                      </span>
                      <small>
                        {n} districts{target === n && <Check size={14} />}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : mode === "join" ? (
                <Link2 />
              ) : (
                <Swords />
              )}
              {busy
                ? "Preparing your table…"
                : mode === "join"
                  ? "Find my table"
                  : mode === "friends"
                    ? "Create private table"
                    : "Take my seat"}
              <ArrowRight />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={selectedRole !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRole(null);
        }}
      >
        <DialogContent className="character-dialog">
          <DialogHeader>
            <DialogTitle>Meet your character</DialogTitle>
            <DialogDescription>
              Choose a new identity each round. Keep it secret until your turn.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && <CharacterCard id={selectedRole} />}
          <Button variant="outline" onClick={() => router.push("/collection")}>
            Explore all eight characters
            <ArrowRight />
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
