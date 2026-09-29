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
});
