import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import {
  applyAction,
  botAction,
  createGame,
  makePlayer,
  viewFor,
} from "../src/lib/game/engine";
import type { Game } from "../src/lib/game/types";

const BOT_DELAY = 850;

const actionValidator = v.object({
  type: v.union(
    v.literal("join"),
    v.literal("start"),
    v.literal("draft"),
    v.literal("discard-role"),
    v.literal("gold"),
    v.literal("draw"),
    v.literal("keep"),
    v.literal("build"),
    v.literal("income"),
    v.literal("ability"),
    v.literal("end"),
    v.literal("smithy"),
    v.literal("laboratory"),
    v.literal("recover"),
    v.literal("pass-recovery"),
    v.literal("add-bot"),
    v.literal("remove-bot"),
    v.literal("replace"),
    v.literal("rematch"),
    v.literal("chat"),
  ),
  name: v.optional(v.string()),
  role: v.optional(v.number()),
  card: v.optional(v.string()),
  cards: v.optional(v.array(v.string())),
  target: v.optional(v.string()),
  text: v.optional(v.string()),
  version: v.optional(v.number()),
});

// The browser keeps a private random token; the public player id is its hash,
// so ids shown to other players can never be used to impersonate a seat.
async function identity(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token))
    throw new Error("Your session is invalid. Please reload the page.");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function cleanName(name: string | undefined) {
  const clean = (name ?? "").trim();
  if (clean.length < 1 || clean.length > 24)
    throw new Error("Please check the information you entered.");
  return clean;
}

// Convex redacts plain Error messages in production; rule violations are
// meant for players, so surface them as ConvexError data.
async function userFacing<R>(run: () => Promise<R>) {
  try {
    return await run();
  } catch (e) {
    if (e instanceof Error && !(e instanceof ConvexError))
      throw new ConvexError(e.message);
    throw e;
  }
}

const newCode = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

async function load(ctx: QueryCtx, code: string) {
  const doc = await ctx.db
    .query("rooms")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
  return doc ? { doc, game: JSON.parse(doc.state) as Game } : null;
}

async function syncSeats(ctx: MutationCtx, g: Game) {
  const humans = new Set(g.players.filter((p) => !p.bot).map((p) => p.id));
  const seats = await ctx.db
    .query("seats")
    .withIndex("by_code", (q) => q.eq("code", g.code))
    .collect();
  for (const seat of seats)
    if (!humans.delete(seat.player)) await ctx.db.delete(seat._id);
  for (const player of humans)
    await ctx.db.insert("seats", { player, code: g.code });
}

async function insert(ctx: MutationCtx, g: Game) {
  await ctx.db.insert("rooms", {
    code: g.code,
    state: JSON.stringify(g),
    updated: Date.now(),
  });
  await syncSeats(ctx, g);
  await scheduleBot(ctx, g);
}

async function save(ctx: MutationCtx, doc: Doc<"rooms">, g: Game) {
  await ctx.db.patch(doc._id, {
    state: JSON.stringify(g),
    updated: Date.now(),
  });
  await syncSeats(ctx, g);
  await scheduleBot(ctx, g);
}

// Computer rivals move on the server a moment after each state change. A step
// only runs if the table is still at the version it was scheduled for, so
// stale steps are harmless.
async function scheduleBot(ctx: MutationCtx, g: Game) {
  if (g.phase === "lobby" || g.phase === "finished") return;
  if (!g.players.find((p) => p.id === g.active)?.bot) return;
  await ctx.scheduler.runAfter(BOT_DELAY, internal.rooms.botStep, {
    code: g.code,
    version: g.version,
  });
}

export const botStep = internalMutation({
  args: { code: v.string(), version: v.number() },
  handler: async (ctx, { code, version }) => {
    const room = await load(ctx, code);
    if (!room || room.game.version !== version) return;
    const g = room.game;
    const action = botAction(g);
    if (!action) return;
    applyAction(g, g.active, action);
    g.version++;
    g.botAt = Date.now();
    g.updatedAt = Date.now();
    await save(ctx, room.doc, g);
  },
});

export const list = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const id = await identity(token);
    const seats = await ctx.db
      .query("seats")
      .withIndex("by_player", (q) => q.eq("player", id))
      .collect();
    const games = (
      await Promise.all(seats.map((s) => load(ctx, s.code)))
    ).flatMap((r) => (r ? [r.game] : []));
    return games
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((g) => {
        const view = g.phase === "finished" ? viewFor(g, id) : null;
        return {
          code: g.code,
          name: g.name,
          phase: g.phase,
          round: g.round,
          players: g.players.length,
          updatedAt: g.updatedAt,
          score: view?.players.find((p) => p.id === id)?.score.total ?? null,
          won: view?.winnerIds.includes(id) ?? false,
        };
      });
  },
});

export const get = query({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, { token, code }) => {
    const id = await identity(token);
    const room = await load(ctx, code.toUpperCase());
    if (!room) return { error: "Table not found. Check your invite code." };
    const g = room.game;
    const p = g.players.find((p) => p.id === id);
    if (!p)
      return {
        join: {
          joinable: g.phase === "lobby" && g.players.length < 7,
          name: g.name,
          players: g.players.length,
          code: g.code,
        },
      };
    if (p.bot)
      return { error: "Your seat is now controlled by a computer rival." };
    return { game: viewFor(g, id) };
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
    mode: v.union(v.literal("solo"), v.literal("friends")),
    players: v.optional(v.number()),
    target: v.optional(v.union(v.literal(7), v.literal(8))),
  },
  handler: (ctx, args) =>
    userFacing(async () => {
      const id = await identity(args.token);
      const name = cleanName(args.name);
      const players = args.players ?? 4;
      if (!Number.isInteger(players) || players < 2 || players > 7)
        throw new Error("Please check the information you entered.");
      const seats = await ctx.db
        .query("seats")
        .withIndex("by_player", (q) => q.eq("player", id))
        .collect();
      let active = 0;
      for (const seat of seats) {
        const room = await load(ctx, seat.code);
        if (room && room.game.phase !== "finished") active++;
      }
      if (active >= 30)
        throw new Error(
          "You have 30 active tables. Finish a game before creating another.",
        );
      const code = newCode();
      const g = createGame(code, id, name, args.target ?? 8);
      if (args.mode === "solo") {
        for (let i = 1; i < players; i++)
          applyAction(g, id, { type: "add-bot" });
        applyAction(g, id, { type: "start" });
      }
      await insert(ctx, g);
      return { code };
    }),
});

export const act = mutation({
  args: { token: v.string(), code: v.string(), action: actionValidator },
  handler: (ctx, { token, code, action }) =>
    userFacing(async () => {
      const id = await identity(token);
      const room = await load(ctx, code.toUpperCase());
      if (!room) throw new Error("Table not found. Check your invite code.");
      const g = room.game;
      if (action.type === "join") {
        const name = cleanName(action.name);
        if (g.players.some((p) => p.id === id && !p.bot)) return null;
        if (g.phase !== "lobby" || g.players.length >= 7)
          throw new Error("This table is already playing or full.");
        g.players.push(makePlayer(id, name));
      } else {
        const { version, name: _name, type, ...rest } = action;
        void _name;
        if (rest.text !== undefined && rest.text.length > 240)
          throw new Error("Write a message of up to 240 characters.");
        if (g.players.find((p) => p.id === id)?.bot)
          throw new Error("This seat is controlled by a computer rival.");
        if (version !== undefined && version !== g.version && type !== "chat")
          throw new Error(
            "The table has moved on. Please try your action again.",
          );
        const previous = type === "rematch" ? structuredClone(g) : null;
        applyAction(g, id, { type, ...rest });
        if (previous) {
          previous.code = newCode();
          previous.archived = true;
          await insert(ctx, previous);
        }
      }
      g.version++;
      g.updatedAt = Date.now();
      g.botAt = Date.now();
      await save(ctx, room.doc, g);
      return null;
    }),
});
