import { NextResponse } from "next/server";
import { z } from "zod";
import { createGame, applyAction, viewFor } from "@/lib/game/engine";
import { gamesFor, insertGame } from "@/lib/game/store";
import { checkOrigin, failure, identity, nameSchema } from "@/lib/game/http";
export const runtime = "nodejs";
export async function GET() {
  try {
    const id = await identity();
    return NextResponse.json(
      {
        games: gamesFor(id).map((g) => ({
          code: g.code,
          name: g.name,
          phase: g.phase,
          round: g.round,
          players: g.players.length,
          updatedAt: g.updatedAt,
          score:
            g.phase === "finished"
              ? viewFor(g, id).players.find((p) => p.id === id)?.score.total
              : null,
          won: g.phase === "finished" && viewFor(g, id).winnerIds.includes(id),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = z
      .object({
        name: nameSchema,
        mode: z.enum(["solo", "friends"]),
        players: z.number().int().min(2).max(7).default(4),
        target: z.union([z.literal(7), z.literal(8)]).default(8),
      })
      .parse(await request.json());
    const id = await identity();
    if (gamesFor(id).filter((g) => g.phase !== "finished").length >= 30)
      throw new Error(
        "You have 30 active tables. Finish a game before creating another.",
      );
    const code = crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();
    const g = createGame(code, id, body.name, body.target);
    if (body.mode === "solo") {
      for (let i = 1; i < body.players; i++)
        applyAction(g, id, { type: "add-bot" });
      applyAction(g, id, { type: "start" });
    }
    insertGame(g);
    return NextResponse.json({ code, game: viewFor(g, id) });
  } catch (e) {
    return failure(e);
  }
}
