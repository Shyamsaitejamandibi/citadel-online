import { district } from "./catalog";
import { score } from "./engine";
import type { GameView } from "./types";

export function buildReason(g: GameView, card: string): string | null {
  const p = g.players.find((p) => p.id === g.me)!;
  const d = district(card);
  if (!p.hand.includes(card)) return "This district isn’t in your hand.";
  if (p.city.some((c) => district(c).id === d.id))
    return "Your city already has this district.";
  if (g.phase !== "turn" || g.active !== g.me)
    return "Plan now. Build when your character is called.";
  if (!g.gathered) return "Gather gold or cards before building.";
  if (g.choices.length) return "Choose your drawn cards first.";
  if (g.builds >= (g.activeRole === 7 ? 3 : 1))
    return "You’ve reached your building limit this turn.";
  if (p.gold < d.cost)
    return `You need ${d.cost - p.gold} more gold to build this district.`;
  return null;
}

export function buildForecast(g: GameView, card: string) {
  const p = g.players.find((p) => p.id === g.me)!;
  const d = district(card);
  const duplicate = p.city.some((c) => district(c).id === d.id);
  const next = {
    ...p,
    city: duplicate ? p.city : [...p.city, card],
    builtAt: { ...p.builtAt, [card]: g.round },
  };
  const before = score(g, p);
  const after = score(
    {
      ...g,
      firstComplete:
        g.firstComplete ?? (next.city.length >= g.target ? p.id : null),
    },
    next,
  );
  return {
    cost: d.cost,
    goldAfter: p.gold - d.cost,
    pointsAdded: after.total - before.total,
    addsColor: !p.city.some((c) => district(c).type === d.type),
    finishesCity: !duplicate && p.city.length === g.target - 1,
    duplicate,
  };
}
