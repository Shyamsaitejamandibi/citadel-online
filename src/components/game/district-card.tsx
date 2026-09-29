"use client";
import { Coins, Castle, Church, Store, Shield, Sparkles } from "lucide-react";
import { district, TYPE_LABELS, type District } from "@/lib/game/catalog";
const icons = {
  noble: Castle,
  religious: Church,
  trade: Store,
  military: Shield,
  unique: Sparkles,
};
export function DistrictCard({
  card,
  data,
  onClick,
  selected,
  compact = false,
  disabled = false,
}: {
  card?: string;
  data?: District;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
}) {
  const d = data ?? district(card!);
  const Icon = icons[d.type];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`district-card type-${d.type} ${compact ? "compact" : ""} ${selected ? "selected" : ""}`}
      aria-label={`${d.name}, ${d.cost} gold, ${TYPE_LABELS[d.type]}. ${d.description}`}
      aria-pressed={selected}
    >
      <div
        className="district-art"
        style={{
          backgroundImage: `url(/art/district-${d.art}.webp)`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <span className="district-price">
          {d.cost}
          <Coins size={13} />
        </span>
        <span className="district-emblem">
          <Icon size={18} />
        </span>
      </div>
      <div className="district-caption">
        <span className="district-type">{TYPE_LABELS[d.type]}</span>
        <h3>{d.name}</h3>
        {!compact && <p>{d.description}</p>}
      </div>
      <div className="district-pips">
        {Array.from({ length: d.cost }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </button>
  );
}
