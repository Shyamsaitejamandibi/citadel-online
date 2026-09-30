"use client";
import {
  Crown,
  Coins,
  Shield,
  WandSparkles,
  Sword,
  VenetianMask,
  DraftingCompass,
  Church,
} from "lucide-react";
import { character } from "@/lib/game/catalog";
export const ROLE_ICONS = [
  Sword,
  VenetianMask,
  WandSparkles,
  Crown,
  Church,
  Coins,
  DraftingCompass,
  Shield,
];
const DRAFT_SUMMARIES = [
  "Skip a character’s turn.",
  "Steal a character’s gold.",
  "Swap hands or redraw cards.",
  "Take the crown. Noble income.",
  "Protect your city. Religious income.",
  "+1 gold. Trade income.",
  "+2 cards. Build up to 3 districts.",
  "Destroy a district. Military income.",
];
export function CharacterCard({
  id,
  selected,
  onClick,
  disabled,
  compact = false,
  draft = false,
}: {
  id: number;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean;
  draft?: boolean;
}) {
  const c = character(id);
  const Icon = ROLE_ICONS[id - 1];
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`character-card ${selected ? "selected" : ""} ${compact ? "compact" : ""}`}
      style={{ "--role-color": c.color } as React.CSSProperties}
      aria-label={`${c.name}: ${c.description}`}
      aria-pressed={selected}
    >
      <div
        className="character-portrait"
        style={{
          backgroundImage: `url(/art/character-${id}.webp)`,
          backgroundPosition: "center 24%",
          backgroundSize: "cover",
        }}
      >
        <span className="character-rank">{id}</span>
        <span className="character-emblem">
          <Icon size={18} strokeWidth={1.4} />
        </span>
      </div>
      <div className="character-caption">
        <h3>{c.name}</h3>
        <span>
          {draft ? DRAFT_SUMMARIES[id - 1] : compact ? c.title : c.description}
        </span>
      </div>
    </button>
  );
}
