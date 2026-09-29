"use client";
import { useState } from "react";
import { Search, Coins, Lightbulb } from "lucide-react";
import {
  CHARACTERS,
  DISTRICTS,
  TYPE_LABELS,
  type DistrictType,
} from "@/lib/game/catalog";
import { CharacterCard } from "@/components/game/character-card";
import { DistrictCard } from "@/components/game/district-card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function Collection() {
  const [tab, setTab] = useState("characters");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [role, setRole] = useState<number | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const characters = CHARACTERS.filter((c) =>
    `${c.name} ${c.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const districts = DISTRICTS.filter(
    (d) =>
      (filter === "all" || d.type === filter) &&
      `${d.name} ${d.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const c = CHARACTERS.find((c) => c.id === role);
  const d = DISTRICTS.find((d) => d.id === card);
  return (
    <main className="page-content">
      <div className="page-intro">
        <p className="eyebrow">THE PEOPLE & PLACES OF YOUR REALM</p>
        <h1>A world of possibilities.</h1>
        <p>
          Eight secret identities. Twenty-eight remarkable districts. Get to
          know the cards that turn a good plan into a great city.
        </p>
      </div>
      <div className="library-toolbar">
        <div className="filter-tabs">
          <button
            className={tab === "characters" ? "active" : ""}
            onClick={() => setTab("characters")}
          >
            Characters · 8
          </button>
          <button
            className={tab === "districts" ? "active" : ""}
            onClick={() => setTab("districts")}
          >
            Districts · 28
          </button>
        </div>
        <div className="relative search-input">
          <Search
            size={15}
            className="absolute left-3 top-[14px] text-muted-foreground"
          />
          <Input
            className="pl-9"
            aria-label="Search cards"
            placeholder="Find a card or ability…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {tab === "characters" ? (
        <div className="character-grid">
          {characters.map((c) => (
            <CharacterCard key={c.id} id={c.id} onClick={() => setRole(c.id)} />
          ))}
        </div>
      ) : (
        <>
          <div className="filter-tabs mb-5">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All districts
            </button>
            {Object.entries(TYPE_LABELS).map(([id, label]) => (
              <button
                key={id}
                className={filter === id ? "active" : ""}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="district-grid">
            {districts.map((d) => (
              <DistrictCard key={d.id} data={d} onClick={() => setCard(d.id)} />
            ))}
          </div>
        </>
      )}
      {!(tab === "characters" ? characters.length : districts.length) && (
        <div className="empty-search">
          <Search className="mx-auto mb-4" />
          <p>No cards match “{query}”. Try another name or ability.</p>
        </div>
      )}
      <div className="hint-box">
        <Lightbulb size={16} />
        <span>
          Colors have meaning: noble districts support the King, religious
          districts the Bishop, trade districts the Merchant, and military
          districts the Warlord. Unique districts bring their own special
          powers.
        </span>
      </div>
      <Dialog
        open={!!c}
        onOpenChange={(v) => {
          if (!v) setRole(null);
        }}
      >
        <DialogContent className="character-dialog">
          <DialogHeader>
            <DialogTitle>{c?.name}</DialogTitle>
            <DialogDescription>{c?.title}</DialogDescription>
          </DialogHeader>
          {c && (
            <>
              <CharacterCard id={c.id} />
              <div className="hint-box">
                <Lightbulb size={16} />
                <span>{c.hint}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!d}
        onOpenChange={(v) => {
          if (!v) setCard(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d?.name}</DialogTitle>
            <DialogDescription>
              {d && TYPE_LABELS[d.type as DistrictType]} district · {d?.copies}{" "}
              {d?.copies === 1 ? "copy" : "copies"} in the deck
            </DialogDescription>
          </DialogHeader>
          {d && (
            <>
              <div className="inspect-card">
                <DistrictCard data={d} />
              </div>
              <p className="inspect-info">
                <Coins size={13} className="inline mr-2" />
                {d.cost} gold to build ·{" "}
                {["university", "dragon-gate"].includes(d.id) ? 8 : d.cost}{" "}
                points at scoring
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
