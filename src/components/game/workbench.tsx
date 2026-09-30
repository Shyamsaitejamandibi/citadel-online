"use client";

import { useState } from "react";
import {
  Castle,
  Check,
  Coins,
  Flag,
  Layers3,
  Pin,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import { district, TYPE_LABELS, type DistrictType } from "@/lib/game/catalog";
import { buildForecast, buildReason } from "@/lib/game/planning";
import type { GameView, PublicPlayer } from "@/lib/game/types";
import { DistrictCard } from "./district-card";

export const DISTRICT_COLORS: DistrictType[] = [
  "noble",
  "religious",
  "trade",
  "military",
  "unique",
];

export function CityColors({ player }: { player: PublicPlayer }) {
  return (
    <div className="city-colors" aria-label="District color diversity">
      {DISTRICT_COLORS.map((type) => {
        const built = player.city.some((c) => district(c).type === type);
        return (
          <span
            key={type}
            className={`color-${type} ${built ? "collected" : ""}`}
            title={`${TYPE_LABELS[type]}: ${built ? "built" : "missing"}`}
            aria-label={`${TYPE_LABELS[type]} ${built ? "built" : "missing"}`}
          >
            {built && <Check size={9} />}
          </span>
        );
      })}
    </div>
  );
}

export function Workbench({
  g,
  inspect,
  planned,
  plan,
}: {
  g: GameView;
  inspect: (card: string) => void;
  planned: string | null;
  plan: (card: string | null) => void;
}) {
  const [sort, setSort] = useState("cost");
  const p = g.players.find((p) => p.id === g.me)!;
  const hand = [...p.hand].sort((a, b) =>
    sort === "color"
      ? DISTRICT_COLORS.indexOf(district(a).type) -
          DISTRICT_COLORS.indexOf(district(b).type) ||
        district(a).cost - district(b).cost
      : sort === "name"
        ? district(a).name.localeCompare(district(b).name)
        : district(a).cost - district(b).cost,
  );
  const forecast = planned ? buildForecast(g, planned) : null;
  const canBuild =
    g.active === g.me && g.phase === "turn" && g.gathered && !g.choices.length;
  return (
    <section className="workbench" aria-label="Your private play area">
      <div className="workbench-heading">
        <div>
          <span className="eyebrow">YOUR SIDE OF THE TABLE</span>
          <h2>A city with your name on it.</h2>
        </div>
        <div className="wallet">
          <span>
            <Coins size={16} />
            <strong>{p.gold}</strong>
            <small>GOLD</small>
          </span>
          <span>
            <Trophy size={16} />
            <strong>{p.score.total}</strong>
            <small>POINTS</small>
          </span>
          <span>
            <Castle size={16} />
            <strong>
              {p.city.length}
              <i>/{g.target}</i>
            </strong>
            <small>BUILT</small>
          </span>
        </div>
      </div>
      <section className="hand-section">
        <div className="hand-heading">
          <h2>
            Your hand <span>{p.handCount}</span>
          </h2>
          <div className="hand-tools">
            <label>
              Sort{" "}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort your hand"
              >
                <option value="cost">Cost</option>
                <option value="color">Color</option>
                <option value="name">Name</option>
              </select>
            </label>
            <span>
              <ShieldCheck size={12} /> Private
            </span>
          </div>
        </div>
        <div className="hand-cards">
          {hand.map((card, index) => {
            const duplicate = p.city.some(
              (c) => district(c).id === district(card).id,
            );
            const legal = !buildReason(g, card);
            return (
              <div
                key={card}
                className={`hand-piece ${legal ? "buildable" : ""} ${planned === card ? "planned" : ""}`}
                style={
                  {
                    "--card-tilt": `${(index - (hand.length - 1) / 2) * Math.min(1.6, 6 / Math.max(1, hand.length))}deg`,
                  } as React.CSSProperties
                }
              >
                <DistrictCard
                  card={card}
                  compact
                  onClick={() => inspect(card)}
                  badge={
                    duplicate
                      ? "Already built"
                      : canBuild
                        ? legal
                          ? "Tap to build"
                          : district(card).cost > p.gold
                            ? `Need ${district(card).cost - p.gold} gold`
                            : undefined
                        : undefined
                  }
                />
                <button
                  className="plan-pin"
                  aria-label={`${planned === card ? "Unplan" : "Plan"} ${district(card).name}`}
                  aria-pressed={planned === card}
                  onClick={() => plan(planned === card ? null : card)}
                >
                  <Pin size={13} />
                </button>
              </div>
            );
          })}
        </div>
        {!hand.length && (
          <div className="hint-box">
            <Layers3 size={17} />
            Gather cards on your next turn to discover your next district.
          </div>
        )}
        <div className={`private-plan ${planned ? "has-plan" : ""}`}>
          <Pin size={16} />
          <div>
            <span className="plan-overline">
              YOUR NEXT MOVE · ONLY YOU CAN SEE THIS
            </span>
            {planned && forecast ? (
              <>
                <button
                  className="planned-title"
                  onClick={() => inspect(planned)}
                >
                  {district(planned).name}
                  <span>
                    {forecast.goldAfter >= 0
                      ? `${forecast.goldAfter} gold left`
                      : `Save ${-forecast.goldAfter} more gold`}{" "}
                    · +{forecast.pointsAdded} points
                    {forecast.addsColor && " · New color"}
                    {forecast.finishesCity && " · Final round"}
                  </span>
                </button>
              </>
            ) : (
              <p>Pin a card to plan your next district while others play.</p>
            )}
          </div>
          {planned && (
            <button
              onClick={() => plan(null)}
              aria-label="Clear planned district"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </section>
      <section className="city-section">
        <div className="hand-heading">
          <h2>
            Your city <span>{p.city.length}</span>
          </h2>
          <div className="city-diversity">
            <CityColors player={p} />
            <span>All 5 colors = +3 points</span>
          </div>
        </div>
        <div className="city-grid">
          {p.city.map((card) => (
            <div className="city-piece" key={card}>
              <DistrictCard card={card} compact onClick={() => inspect(card)} />
              <span className="built-stamp">
                <Check size={10} /> BUILT
              </span>
            </div>
          ))}
          {p.city.length < g.target && (
            <div className="city-slot">
              <Castle size={27} strokeWidth={1} />
              <strong>
                {p.city.length ? "The next chapter" : "Every city starts here"}
              </strong>
              <span>{g.target - p.city.length} DISTRICTS TO COMPLETE</span>
              <small>
                <Flag size={12} /> Completion triggers the final round
              </small>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
