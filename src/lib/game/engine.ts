import { CHARACTERS, DISTRICTS, character, district } from "./catalog";
import type {
  Game,
  GameAction,
  GameView,
  Moment,
  Player,
  Score,
} from "./types";
export const shuffle = <T>(items: T[]): T[] => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export function log(
  g: Game,
  text: string,
  kind: Game["log"][number]["kind"] = "game",
  player?: string,
  moment?: Moment,
) {
  g.log.push({
    id: (g.log.at(-1)?.id ?? 0) + 1,
    round: g.round,
    text,
    kind,
    ...(player ? { player } : {}),
    ...(moment ? { moment } : {}),
  });
  if (g.log.length > 250) g.log.shift();
}
export function makePlayer(id: string, name: string, bot = false): Player {
  return {
    id,
    name,
    bot,
    gold: 2,
    hand: [],
    city: [],
    roles: [],
    revealed: [],
    builtAt: {},
  };
}
export function createGame(
  code: string,
  id: string,
  name: string,
  target = 8,
): Game {
  return {
    code,
    host: id,
    name: `${name}’s table`,
    phase: "lobby",
    players: [makePlayer(id, name)],
    deck: [],
    round: 0,
    crown: id,
    draftOrder: [],
    draftIndex: 0,
    draftDiscard: false,
    available: [],
    faceup: [],
    facedown: [],
    activeRole: 0,
    active: id,
    killed: null,
    robbed: null,
    gathered: false,
    builds: 0,
    incomeUsed: false,
    abilityUsed: false,
    districtUsed: [],
    choices: [],
    keepCount: 1,
    firstComplete: null,
    target,
    log: [],
    recovery: null,
    version: 0,
    updatedAt: Date.now(),
    botAt: 0,
    createdAt: Date.now(),
  };
}
function requireRule(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const has = (p: Player, id: string) =>
  p.city.some((c) => district(c).id === id);
function draw(g: Game, n: number) {
  return g.deck.splice(0, n);
}
export function score(g: Game, p: Player): Score {
  const districts = p.city.reduce((sum, c) => sum + district(c).cost, 0);
  const colors = new Set(p.city.map((c) => district(c).type));
  const wild = p.city.some(
    (c) => district(c).id === "haunted-city" && p.builtAt[c] < g.round,
  );
  const diversity =
    colors.size === 5 ||
    (colors.size === 4 &&
      wild &&
      p.city.filter((c) => district(c).type === "unique").length >= 2)
      ? 3
      : 0;
  const completion =
    p.city.length >= g.target ? (g.firstComplete === p.id ? 4 : 2) : 0;
  const special =
    p.city.filter((c) => ["university", "dragon-gate"].includes(district(c).id))
      .length * 2;
  return {
    districts,
    diversity,
    completion,
    special,
    total: districts + diversity + completion + special,
  };
}
export function winners(g: Game) {
  if (g.phase !== "finished") return [];
  const ranked = [...g.players].sort(
    (a, b) =>
      score(g, b).total - score(g, a).total ||
      score(g, b).districts - score(g, a).districts ||
      b.gold - a.gold,
  );
  const first = ranked[0];
  return ranked
    .filter(
      (p) =>
        score(g, p).total === score(g, first).total &&
        score(g, p).districts === score(g, first).districts &&
        p.gold === first.gold,
    )
    .map((p) => p.id);
}
function beginRound(g: Game) {
  g.round++;
  g.phase = "draft";
  g.killed = null;
  g.robbed = null;
  g.activeRole = 0;
  g.players.forEach((p) => {
    p.roles = [];
    p.revealed = [];
  });
  const roles = shuffle(CHARACTERS.map((c) => c.id));
  g.facedown = [roles.shift()!];
  g.faceup = [];
  const remove = g.players.length >= 4 ? Math.max(0, 6 - g.players.length) : 0;
  while (g.faceup.length < remove) {
    const i = roles.findIndex((r) => r !== 4);
    g.faceup.push(roles.splice(i, 1)[0]);
  }
  g.available = roles;
  const crownIndex = g.players.findIndex((p) => p.id === g.crown);
  const order = [
    ...g.players.slice(crownIndex),
    ...g.players.slice(0, crownIndex),
  ].map((p) => p.id);
  g.draftOrder = g.players.length < 4 ? [...order, ...order] : order;
  g.draftIndex = 0;
  g.draftDiscard = false;
  g.active = g.draftOrder[0];
  log(
    g,
    `Round ${g.round}. ${g.players[crownIndex].name} holds the crown and chooses first.`,
    "game",
    undefined,
    { type: "round", round: g.round, crown: g.crown },
  );
}
function start(g: Game) {
  requireRule(
    g.players.length >= 2,
    "Invite a friend or add a rival to begin.",
  );
  g.deck = shuffle(
    DISTRICTS.flatMap((d) =>
      Array.from({ length: d.copies }, (_, i) => `${d.id}:${i}`),
    ),
  );
  g.players.forEach((p) => {
    p.gold = 2;
    p.hand = draw(g, 4);
    p.city = [];
    p.roles = [];
    p.revealed = [];
    p.builtAt = {};
  });
  g.round = 0;
  g.firstComplete = null;
  g.log = [];
  g.crown = g.host;
  beginRound(g);
}
function advanceDraft(g: Game) {
  g.draftIndex++;
  if (g.draftIndex >= g.draftOrder.length) {
    g.phase = "turn";
    g.activeRole = 0;
    nextTurn(g);
    return;
  }
  g.active = g.draftOrder[g.draftIndex];
  if (g.players.length === 7 && g.draftIndex === 6) {
    g.available.push(...g.facedown);
    g.facedown = [];
  }
}
function nextTurn(g: Game) {
  g.choices = [];
  g.gathered = false;
  g.builds = 0;
  g.incomeUsed = false;
  g.abilityUsed = false;
  g.districtUsed = [];
  for (let r = g.activeRole + 1; r <= 8; r++) {
    g.activeRole = r;
    const p = g.players.find((p) => p.roles.includes(r));
    if (!p) {
      // Face-up characters are known to be out; everyone else is called aloud.
      if (!g.faceup.includes(r))
        log(
          g,
          `No one answers the call of the ${character(r).name}.`,
          "game",
          undefined,
          {
            type: "unanswered",
            role: r,
          },
        );
      continue;
    }
    if (r === g.killed) {
      log(
        g,
        `${character(r).name} was assassinated and misses their turn.`,
        "power",
        undefined,
        { type: "killed", role: r },
      );
      continue;
    }
    g.active = p.id;
    p.revealed.push(r);
    if (r === 4) {
      g.crown = p.id;
      log(g, `${p.name} takes the crown.`, "power");
    }
    if (r === g.robbed) {
      const thief = g.players.find((p) => p.roles.includes(2));
      if (thief) {
        const stolen = p.gold;
        p.gold = 0;
        thief.gold += stolen;
        log(
          g,
          `${character(r).name} loses ${stolen} gold to ${thief.name}, the Thief.`,
          "power",
          undefined,
          {
            type: "robbed",
            role: r,
            player: p.id,
            thief: thief.id,
            gold: stolen,
          },
        );
      }
    }
    log(g, `${p.name} reveals the ${character(r).name}.`, "game", undefined, {
      type: "reveal",
      role: r,
      player: p.id,
    });
    return;
  }
  const deadKing =
    g.killed === 4 ? g.players.find((p) => p.roles.includes(4)) : undefined;
  if (deadKing) {
    g.crown = deadKing.id;
    log(g, `${deadKing.name}, the assassinated King, inherits the crown.`);
  }
  if (g.firstComplete) {
    g.phase = "finished";
    g.players.forEach((p) => (p.revealed = [...p.roles]));
    const names = winners(g)
      .map((id) => g.players.find((p) => p.id === id)!.name)
      .join(" & ");
    log(
      g,
      `${names} ${names.includes(" & ") ? "share" : "wins"} the crown. The cities are complete!`,
      "game",
      undefined,
      { type: "winner", players: winners(g) },
    );
    return;
  }
  beginRound(g);
}
function afterGather(g: Game, p: Player) {
  g.gathered = true;
  if (g.activeRole === 6) {
    p.gold++;
    log(g, `${p.name} earns the Merchant’s bonus gold.`, "power");
  }
  if (g.activeRole === 7) {
    p.hand.push(...draw(g, 2));
    log(g, `${p.name} draws two extra cards as the Architect.`, "power");
  }
}
export function buildCost(p: Player, card: string) {
  return district(card).cost;
}
export function destructionCost(p: Player, card: string) {
  return Math.max(
    0,
    district(card).cost -
      1 +
      (has(p, "great-wall") && district(card).id !== "great-wall" ? 1 : 0),
  );
}
export function canDestroy(g: Game, target: Player, card: string) {
  return (
    target.city.includes(card) &&
    target.city.length < g.target &&
    district(card).id !== "keep" &&
    !(target.roles.includes(5) && g.killed !== 5)
  );
}
const BOT_NAMES = [
  "Lady Eleanor",
  "Lord Aldric",
  "Isolde",
  "Sir Rowan",
  "Theodora",
  "Lucien",
];
export function applyAction(g: Game, id: string, a: GameAction) {
  const p = g.players.find((p) => p.id === id);
  requireRule(p, "Join this table before playing.");
  if (a.type === "chat") {
    requireRule(
      typeof a.text === "string" &&
        a.text.trim().length > 0 &&
        a.text.length <= 240,
      "Write a message of up to 240 characters.",
    );
    log(g, a.text.trim(), "chat", p.id);
    return;
  }
  if (a.type === "add-bot") {
    requireRule(
      id === g.host && g.phase === "lobby",
      "Only the host can add test bots in the lobby.",
    );
    requireRule(g.players.length < 7, "This table seats up to seven.");
    const name =
      BOT_NAMES.find((n) => !g.players.some((p) => p.name === n)) ?? "Bot";
    g.players.push(makePlayer(`bot-${crypto.randomUUID()}`, name, true));
    return;
  }
  if (a.type === "remove-bot") {
    requireRule(
      id === g.host && g.phase === "lobby",
      "Only the host can edit this table.",
    );
    g.players = g.players.filter((p) => p.id !== a.target || !p.bot);
    return;
  }
  if (a.type === "replace") {
    requireRule(
      id === g.host && g.phase !== "lobby" && g.phase !== "finished",
      "Only the host can replace a player during a game.",
    );
    const target = g.players.find((p) => p.id === a.target);
    requireRule(
      target && target.id !== id && !target.bot,
      "Choose another human player.",
    );
    target.bot = true;
    log(g, `${target.name} is now controlled by a computer rival.`);
    return;
  }
  if (a.type === "leave") {
    requireRule(g.phase === "lobby", "You can only leave from the lobby.");
    g.players = g.players.filter((x) => x.id !== id);
    if (g.host === id && g.players.length) g.host = g.players[0].id;
    log(g, `${p.name} leaves the table.`);
    return;
  }
  if (a.type === "kick") {
    requireRule(
      id === g.host && g.phase === "lobby",
      "Only the host can edit this table.",
    );
    requireRule(a.target !== id, "Choose another player.");
    g.players = g.players.filter((x) => x.id !== a.target);
    return;
  }
  if (a.type === "start" || a.type === "rematch" || a.type === "reopen") {
    requireRule(
      !g.archived,
      "This result is archived. Create a new table to play again.",
    );
    requireRule(
      a.type === "rematch" ? !p.bot : id === g.host,
      "Only the host can start the game.",
    );
    requireRule(
      a.type === "start" ? g.phase === "lobby" : g.phase === "finished",
      "The table is not ready for a new game.",
    );
    if (g.phase === "finished") {
      g.series ??= { games: 0, wins: {} };
      g.series.games++;
      for (const w of winners(g))
        g.series.wins[w] = (g.series.wins[w] ?? 0) + 1;
    }
    if (a.type === "reopen") {
      g.phase = "lobby";
      g.log = [];
      log(g, `${p.name} opened the table for the next game.`);
      return;
    }
    start(g);
    return;
  }
  requireRule(
    !p.bot || id === g.active || g.recovery?.player === id,
    "This seat is controlled by a computer.",
  );
  if (g.phase === "recovery") {
    requireRule(g.recovery?.player === id, "Waiting for the Graveyard owner.");
    requireRule(
      a.type === "recover" || a.type === "pass-recovery",
      "Resolve the Graveyard first.",
    );
    if (a.type === "recover") {
      requireRule(p.gold >= 1, "You need one gold.");
      p.gold--;
      p.hand.push(g.recovery.card);
      log(
        g,
        `${p.name} recovers ${district(g.recovery.card).name} from the Graveyard.`,
        "power",
      );
    } else g.deck.push(g.recovery.card);
    g.active = g.recovery.warlord;
    g.recovery = null;
    g.phase = "turn";
    return;
  }
  requireRule(g.active === id, "It is another player’s turn.");
  if (g.phase === "draft") {
    requireRule(
      (a.type === "draft" && !g.draftDiscard) ||
        (a.type === "discard-role" && g.draftDiscard),
      "Choose a character for this step.",
    );
    requireRule(
      a.role && g.available.includes(a.role),
      "That character is unavailable.",
    );
    g.available = g.available.filter((r) => r !== a.role);
    if (g.draftDiscard) {
      g.facedown.push(a.role);
      g.draftDiscard = false;
      advanceDraft(g);
    } else {
      p.roles.push(a.role);
      log(g, `${p.name} chooses a secret character.`);
      if (g.players.length === 2 && (g.draftIndex === 1 || g.draftIndex === 2))
        g.draftDiscard = true;
      else advanceDraft(g);
    }
    return;
  }
  requireRule(g.phase === "turn", "This game is not in progress.");
  if (g.choices.length) {
    requireRule(a.type === "keep", "Choose your district cards first.");
    const cards = a.cards ?? (a.card ? [a.card] : []);
    requireRule(
      cards.length === Math.min(g.keepCount, g.choices.length) &&
        new Set(cards).size === cards.length &&
        cards.every((c) => g.choices.includes(c)),
      "Choose the indicated number of cards.",
    );
    p.hand.push(...cards);
    g.deck.push(...g.choices.filter((c) => !cards.includes(c)));
    g.choices = [];
    afterGather(g, p);
    return;
  }
  switch (a.type) {
    case "gold":
      requireRule(!g.gathered, "You already gathered resources.");
      p.gold += 2;
      log(g, `${p.name} collects two gold.`);
      afterGather(g, p);
      break;
    case "draw":
      requireRule(!g.gathered, "You already gathered resources.");
      requireRule(g.deck.length > 0, "The district deck is empty.");
      g.choices = draw(g, has(p, "observatory") ? 3 : 2);
      g.keepCount = has(p, "library") ? 2 : 1;
      log(g, `${p.name} draws district cards.`);
      break;
    case "build": {
      requireRule(g.gathered, "Gather gold or cards before building.");
      requireRule(
        a.card && p.hand.includes(a.card),
        "That district is not in your hand.",
      );
      const d = district(a.card);
      requireRule(
        g.builds < (g.activeRole === 7 ? 3 : 1),
        "You reached your building limit for this turn.",
      );
      requireRule(
        !p.city.some((c) => district(c).id === d.id),
        "Your city already has this district.",
      );
      requireRule(
        p.gold >= buildCost(p, a.card),
        "You do not have enough gold.",
      );
      p.gold -= buildCost(p, a.card);
      p.hand = p.hand.filter((c) => c !== a.card);
      p.city.push(a.card);
      p.builtAt[a.card] = g.round;
      g.builds++;
      log(g, `${p.name} builds the ${d.name}.`, "build");
      if (p.city.length >= g.target && !g.firstComplete) {
        g.firstComplete = p.id;
        log(
          g,
          `${p.name} completes their city! This is the final round.`,
          "game",
          undefined,
          { type: "complete", player: p.id },
        );
      }
      break;
    }
    case "income": {
      const color = character(g.activeRole).income;
      requireRule(color && !g.incomeUsed, "Income is not available.");
      const amount = p.city.filter(
        (c) =>
          district(c).type === color || district(c).id === "school-of-magic",
      ).length;
      p.gold += amount;
      g.incomeUsed = true;
      log(g, `${p.name} collects ${amount} gold in district income.`, "power");
      break;
    }
    case "ability": {
      requireRule(!g.abilityUsed, "You already used this character’s power.");
      if (g.activeRole === 1 || g.activeRole === 2) {
        requireRule(
          a.role &&
            a.role > g.activeRole &&
            a.role <= 8 &&
            (g.activeRole !== 2 || a.role !== g.killed),
          "Choose a legal character target.",
        );
        if (g.activeRole === 1) {
          g.killed = a.role;
          log(
            g,
            `The Assassin targets the ${character(a.role).name}.`,
            "power",
            undefined,
            { type: "target", role: a.role, by: 1 },
          );
        } else {
          g.robbed = a.role;
          log(
            g,
            `The Thief targets the ${character(a.role).name}.`,
            "power",
            undefined,
            {
              type: "target",
              role: a.role,
              by: 2,
            },
          );
        }
      } else if (g.activeRole === 3) {
        if (a.target) {
          const target = g.players.find(
            (x) => x.id === a.target && x.id !== id,
          );
          requireRule(target, "Choose another player.");
          [p.hand, target.hand] = [target.hand, p.hand];
          log(g, `${p.name} exchanges hands with ${target.name}.`, "power");
        } else {
          const cards = a.cards ?? [];
          requireRule(
            new Set(cards).size === cards.length &&
              cards.every((c) => p.hand.includes(c)),
            "Choose cards from your hand.",
          );
          p.hand = p.hand.filter((c) => !cards.includes(c));
          g.deck.push(...cards);
          p.hand.push(...draw(g, cards.length));
          log(
            g,
            `${p.name} exchanges ${cards.length} cards with the deck.`,
            "power",
          );
        }
      } else if (g.activeRole === 8) {
        const target = g.players.find((x) => x.id === a.target);
        requireRule(
          target && a.card && canDestroy(g, target, a.card),
          "That district is protected.",
        );
        const cost = destructionCost(target, a.card);
        requireRule(
          p.gold >= cost,
          "You do not have enough gold for this siege.",
        );
        p.gold -= cost;
        target.city = target.city.filter((c) => c !== a.card);
        log(
          g,
          `${p.name} destroys ${target.name}’s ${district(a.card).name} for ${cost} gold.`,
          "power",
          undefined,
          { type: "destroyed", player: target.id, by: p.id, card: a.card },
        );
        const graveyard = g.players.find(
          (x) => has(x, "graveyard") && !x.roles.includes(8) && x.gold > 0,
        );
        if (graveyard) {
          g.phase = "recovery";
          g.recovery = { player: graveyard.id, card: a.card, warlord: id };
          g.active = graveyard.id;
        } else g.deck.push(a.card);
      } else throw new Error("This character’s power works automatically.");
      g.abilityUsed = true;
      break;
    }
    case "smithy":
      requireRule(
        has(p, "smithy") && !g.districtUsed.includes("smithy"),
        "The Smithy is not available.",
      );
      requireRule(
        p.gold >= 2 && g.deck.length > 0,
        "You need two gold and cards in the deck.",
      );
      p.gold -= 2;
      p.hand.push(...draw(g, 3));
      g.districtUsed.push("smithy");
      log(g, `${p.name} uses the Smithy.`, "power");
      break;
    case "laboratory":
      requireRule(
        has(p, "laboratory") && !g.districtUsed.includes("laboratory"),
        "The Laboratory is not available.",
      );
      requireRule(
        a.card && p.hand.includes(a.card),
        "Choose a card to discard.",
      );
      p.hand = p.hand.filter((c) => c !== a.card);
      g.deck.push(a.card);
      p.gold++;
      g.districtUsed.push("laboratory");
      log(g, `${p.name} uses the Laboratory.`, "power");
      break;
    case "end":
      requireRule(g.gathered, "Gather gold or cards before ending your turn.");
      nextTurn(g);
      break;
    default:
      throw new Error("That action is not available.");
  }
}
export function botAction(g: Game): GameAction | null {
  const p = g.players.find((p) => p.id === g.active);
  if (!p?.bot) return null;
  if (g.phase === "recovery") return { type: "recover" };
  if (g.phase === "draft") {
    const preference = (r: number) => {
      const c = character(r);
      return (
        Math.random() * 4 +
        (r === 6 ? 2 : 0) +
        (r === 7 && p.gold >= 5 ? 4 : 0) +
        (c.income
          ? p.city.filter((x) => district(x).type === c.income).length * 2
          : 0) +
        (r === 3 && p.hand.length < 2 ? 4 : 0) +
        (r === 5 && p.city.length >= 5 ? 3 : 0)
      );
    };
    const roles = g.available
      .map((r) => ({ r, weight: preference(r) }))
      .sort((a, b) => b.weight - a.weight);
    return {
      type: g.draftDiscard ? "discard-role" : "draft",
      role: g.draftDiscard ? roles.at(-1)!.r : roles[0].r,
    };
  }
  if (g.phase !== "turn") return null;
  if (g.choices.length)
    return {
      type: "keep",
      cards: [...g.choices]
        .sort((a, b) => {
          const value = (c: string) =>
            district(c).cost +
            (p.city.some((x) => district(x).id === district(c).id) ? -20 : 0);
          return value(b) - value(a);
        })
        .slice(0, g.keepCount),
    };
  if (!g.abilityUsed && (g.activeRole === 1 || g.activeRole === 2)) {
    const roles = CHARACTERS.filter(
      (c) =>
        c.id > g.activeRole &&
        c.id !== g.killed &&
        !g.faceup.includes(c.id) &&
        !p.roles.includes(c.id),
    );
    return { type: "ability", role: shuffle(roles)[0]?.id ?? 8 };
  }
  if (!g.incomeUsed && character(g.activeRole).income)
    return { type: "income" };
  if (!g.gathered)
    return {
      type:
        p.hand.filter(
          (c) => !p.city.some((x) => district(x).id === district(c).id),
        ).length < 2 &&
        g.deck.length > 0 &&
        p.gold >= 3
          ? "draw"
          : "gold",
    };
  if (g.activeRole === 3 && !g.abilityUsed) {
    const target = [...g.players]
      .filter((x) => x.id !== p.id)
      .sort((a, b) => b.hand.length - a.hand.length)[0];
    if (target.hand.length > p.hand.length + 1)
      return { type: "ability", target: target.id };
  }
  const cards = p.hand
    .filter(
      (c) =>
        district(c).cost <= p.gold &&
        !p.city.some((x) => district(x).id === district(c).id),
    )
    .sort((a, b) => district(b).cost - district(a).cost);
  if (g.builds < (g.activeRole === 7 ? 3 : 1) && cards.length)
    return { type: "build", card: cards[0] };
  if (g.activeRole === 8 && !g.abilityUsed) {
    const options = g.players
      .filter((x) => x.id !== p.id)
      .flatMap((target) =>
        target.city
          .filter(
            (c) =>
              canDestroy(g, target, c) &&
              destructionCost(target, c) <= p.gold &&
              destructionCost(target, c) <= 3,
          )
          .map((card) => ({ target, card })),
      )
      .sort((a, b) => b.target.city.length - a.target.city.length);
    if (options.length)
      return {
        type: "ability",
        target: options[0].target.id,
        card: options[0].card,
      };
  }
  if (has(p, "laboratory") && !g.districtUsed.includes("laboratory")) {
    const duplicate = p.hand.find((c) =>
      p.city.some((x) => district(x).id === district(c).id),
    );
    if (duplicate) return { type: "laboratory", card: duplicate };
  }
  return { type: "end" };
}
export function viewFor(g: Game, id: string): GameView {
  const { deck, facedown: _facedown, players, ...rest } = g;
  void _facedown;
  return {
    ...rest,
    available: g.phase === "draft" && g.active === id ? [...g.available] : [],
    choices: g.active === id ? [...g.choices] : [],
    deckCount: deck.length,
    players: players.map((p) => ({
      ...p,
      hand: p.id === id ? [...p.hand] : [],
      handCount: p.hand.length,
      roles:
        p.id === id || g.phase === "finished" ? [...p.roles] : [...p.revealed],
      score: score(g, p),
    })),
    me: id,
    winnerIds: winners(g),
  };
}
