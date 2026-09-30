export type Player = {
  id: string;
  name: string;
  bot: boolean;
  ready?: boolean;
  gold: number;
  hand: string[];
  city: string[];
  roles: number[];
  revealed: number[];
  builtAt: Record<string, number>;
};
export type GameAction = {
  type:
    | "start"
    | "ready"
    | "draft"
    | "discard-role"
    | "gold"
    | "draw"
    | "keep"
    | "build"
    | "income"
    | "ability"
    | "end"
    | "smithy"
    | "laboratory"
    | "recover"
    | "pass-recovery"
    | "replace"
    | "add-bot"
    | "remove-bot"
    | "rematch"
    | "reopen"
    | "leave"
    | "kick"
    | "chat";
  role?: number;
  card?: string;
  cards?: string[];
  target?: string;
  text?: string;
  ready?: boolean;
};
// A dramatic beat the table should play out for everyone (reveals, murders…).
export type Moment =
  | { type: "reveal"; role: number; player: string }
  | { type: "unanswered"; role: number }
  | { type: "killed"; role: number }
  | {
      type: "robbed";
      role: number;
      player: string;
      thief: string;
      gold: number;
    }
  | { type: "target"; role: number; by: number }
  | { type: "destroyed"; player: string; by: string; card: string }
  | { type: "complete"; player: string }
  | { type: "winner"; players: string[] }
  | { type: "round"; round: number; crown: string };
export type Game = {
  archived?: boolean;
  code: string;
  host: string;
  name: string;
  phase: "lobby" | "draft" | "turn" | "recovery" | "finished";
  players: Player[];
  deck: string[];
  round: number;
  crown: string;
  draftOrder: string[];
  draftIndex: number;
  draftDiscard: boolean;
  available: number[];
  faceup: number[];
  facedown: number[];
  activeRole: number;
  active: string;
  killed: number | null;
  robbed: number | null;
  gathered: boolean;
  builds: number;
  incomeUsed: boolean;
  abilityUsed: boolean;
  districtUsed: string[];
  choices: string[];
  keepCount: number;
  firstComplete: string | null;
  target: number;
  log: {
    id: number;
    round: number;
    text: string;
    kind: "game" | "build" | "power" | "chat";
    player?: string;
    moment?: Moment;
  }[];
  // Wins per player id across rematches at this table.
  series?: { games: number; wins: Record<string, number> };
  // When the current player started acting, for the "thinking…" timer.
  turnAt?: number;
  recovery: { player: string; card: string; warlord: string } | null;
  version: number;
  updatedAt: number;
  botAt: number;
  createdAt: number;
};
export type PublicPlayer = Omit<Player, "hand" | "roles"> & {
  hand: string[];
  handCount: number;
  roles: number[];
  score: Score;
};
export type Score = {
  districts: number;
  diversity: number;
  completion: number;
  special: number;
  total: number;
};
export type GameView = Omit<Game, "deck" | "facedown" | "players"> & {
  deckCount: number;
  players: PublicPlayer[];
  me: string;
  winnerIds: string[];
};
