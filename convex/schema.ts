import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Full game state is stored as serialized JSON, exactly as the engine
  // produces it. Convex mutations are serializable transactions, so every
  // read-modify-write of a room is atomic.
  rooms: defineTable({
    code: v.string(),
    state: v.string(),
    updated: v.number(),
  }).index("by_code", ["code"]),
  // One row per human seat so a player's tables can be listed.
  seats: defineTable({
    player: v.string(),
    code: v.string(),
  })
    .index("by_player", ["player"])
    .index("by_code", ["code"]),
  // Last check-in time for each browser viewing a table.
  presence: defineTable({
    code: v.string(),
    player: v.string(),
    lastSeen: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_code_player", ["code", "player"]),
  // Short-lived emoji reactions shown over a player's seat.
  reactions: defineTable({
    code: v.string(),
    player: v.string(),
    emoji: v.string(),
  }).index("by_code", ["code"]),
});
