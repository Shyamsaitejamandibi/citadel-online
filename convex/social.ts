import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { identity, load } from "./rooms";
import { REACTIONS } from "../src/lib/game/reactions";

async function seated(
  token: string,
  code: string,
  ctx: Parameters<typeof load>[0],
) {
  const id = await identity(token);
  const room = await load(ctx, code.toUpperCase());
  if (!room?.game.players.some((p) => p.id === id && !p.bot)) return null;
  return { id, code: room.game.code };
}

export const heartbeat = mutation({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, { token, code }) => {
    const seat = await seated(token, code, ctx);
    if (!seat) return;
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_code_player", (q) =>
        q.eq("code", seat.code).eq("player", seat.id),
      )
      .unique();
    if (existing) await ctx.db.patch(existing._id, { lastSeen: Date.now() });
    else
      await ctx.db.insert("presence", {
        code: seat.code,
        player: seat.id,
        lastSeen: Date.now(),
      });
  },
});

export const presence = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .collect();
    return rows.map((r) => ({ player: r.player, lastSeen: r.lastSeen }));
  },
});

export const react = mutation({
  args: { token: v.string(), code: v.string(), emoji: v.string() },
  handler: async (ctx, { token, code, emoji }) => {
    if (!REACTIONS.includes(emoji))
      throw new ConvexError("That reaction is not available.");
    const seat = await seated(token, code, ctx);
    if (!seat) throw new ConvexError("Take a seat to react.");
    const recent = await ctx.db
      .query("reactions")
      .withIndex("by_code", (q) => q.eq("code", seat.code))
      .order("desc")
      .take(20);
    const mine = recent.filter(
      (r) => r.player === seat.id && Date.now() - r._creationTime < 3000,
    );
    if (mine.length >= 3) return;
    const id = await ctx.db.insert("reactions", {
      code: seat.code,
      player: seat.id,
      emoji,
    });
    await ctx.scheduler.runAfter(60_000, internal.social.expire, { id });
  },
});

export const expire = internalMutation({
  args: { id: v.id("reactions") },
  handler: async (ctx, { id }) => {
    if (await ctx.db.get(id)) await ctx.db.delete(id);
  },
});

export const reactions = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const rows = await ctx.db
      .query("reactions")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .order("desc")
      .take(20);
    return rows.map((r) => ({
      id: r._id,
      player: r.player,
      emoji: r.emoji,
      at: r._creationTime,
    }));
  },
});
