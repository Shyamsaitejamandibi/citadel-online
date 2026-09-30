import { applyAction, createGame, makePlayer } from "./engine";
import { DISTRICTS } from "./catalog";
import type { Game, GameAction } from "./types";

export const APPRENTICE = "apprentice";

// A reproducible four-player lesson. Moves go through the same rules as online play.
export function createLesson(): Game {
  const g = createGame("LESSON", APPRENTICE, "You");
  g.players.push(
    ...["Rowan", "Theodora", "Lucien"].map((name) =>
      makePlayer(name, name, true),
    ),
  );
  g.players[0].ready = true;
  applyAction(g, APPRENTICE, { type: "start" });
  const deck = DISTRICTS.flatMap((d) =>
    Array.from({ length: d.copies }, (_, i) => `${d.id}:${i}`),
  );
  const hand = ["tavern:0", "temple:0", "market:0", "palace:0"];
  g.deck = deck.filter((c) => !hand.includes(c));
  g.players[0].hand = hand;
  for (const player of g.players.slice(1)) player.hand = g.deck.splice(0, 4);
  g.available = [1, 3, 4, 5, 6];
  g.faceup = [2, 8];
  g.facedown = [7];
  return g;
}

export function lessonMove(game: Game, action: GameAction): Game {
  const g = structuredClone(game);
  applyAction(g, APPRENTICE, action);
  if (action.type === "draft") {
    // Demonstrate the other seats choosing privately, then calling order.
    for (const role of [4, 5, 3])
      applyAction(g, g.active, { type: "draft", role });
    while (g.active !== APPRENTICE) {
      applyAction(g, g.active, { type: "gold" });
      applyAction(g, g.active, { type: "end" });
    }
  }
  return g;
}
