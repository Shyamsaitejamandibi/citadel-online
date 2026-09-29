import { NextResponse } from "next/server";
import { applyAction, botAction, makePlayer, viewFor } from "@/lib/game/engine";
import { transact, insertGame } from "@/lib/game/store";
import {
  actionSchema,
  checkOrigin,
  failure,
  identity,
  nameSchema,
} from "@/lib/game/http";
export const runtime = "nodejs";
type Context = { params: Promise<{ code: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const id = await identity();
    const { code } = await context.params;
    const result = transact(code.toUpperCase(), (g) => {
      const p = g.players.find((p) => p.id === id);
      if (!p)
        return {
          joinable: g.phase === "lobby" && g.players.length < 7,
          name: g.name,
          players: g.players.length,
          code: g.code,
        };
      if (p.bot)
        throw new Error("Your seat is now controlled by a computer rival.");
      if (Date.now() - g.botAt >= 850) {
        const action = botAction(g);
        if (action) {
          applyAction(g, g.active, action);
          g.version++;
          g.botAt = Date.now();
          g.updatedAt = Date.now();
        }
      }
      return { game: viewFor(g, id) };
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const id = await identity();
    const { code } = await context.params;
    const raw = await request.json();
    const result = transact(code.toUpperCase(), (g) => {
      if (raw.type === "join") {
        const name = nameSchema.parse(raw.name);
        if (g.players.some((p) => p.id === id && !p.bot)) return viewFor(g, id);
        if (g.phase !== "lobby" || g.players.length >= 7)
          throw new Error("This table is already playing or full.");
        g.players.push(makePlayer(id, name));
      } else {
        const action = actionSchema.parse(raw);
        if (g.players.find((p) => p.id === id)?.bot)
          throw new Error("This seat is controlled by a computer rival.");
        if (
          action.version !== undefined &&
          action.version !== g.version &&
          action.type !== "chat"
        )
          throw new Error(
            "The table has moved on. Please try your action again.",
          );
        const previous = action.type === "rematch" ? structuredClone(g) : null;
        applyAction(g, id, action);
        if (previous) {
          previous.code = crypto
            .randomUUID()
            .replace(/-/g, "")
            .slice(0, 8)
            .toUpperCase();
          previous.archived = true;
          insertGame(previous);
        }
      }
      g.version++;
      g.updatedAt = Date.now();
      g.botAt = Date.now();
      return viewFor(g, id);
    });
    return NextResponse.json({ game: result });
  } catch (e) {
    return failure(e);
  }
}
