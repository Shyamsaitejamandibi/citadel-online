import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
export async function identity() {
  const jar = await cookies();
  let id = jar.get("citadel-session")?.value;
  if (!id || !z.uuid().safeParse(id).success) {
    id = crypto.randomUUID();
    jar.set("citadel-session", id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return createHash("sha256").update(id).digest("hex");
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new Error("This request must come from your game page.");
}
export function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof z.ZodError
          ? "Please check the information you entered."
          : error instanceof Error
            ? error.message
            : "Something went wrong.",
    },
    { status: 400 },
  );
}
export const nameSchema = z.string().trim().min(1).max(24);
export const actionSchema = z.object({
  type: z.enum([
    "start",
    "draft",
    "discard-role",
    "gold",
    "draw",
    "keep",
    "build",
    "income",
    "ability",
    "end",
    "smithy",
    "laboratory",
    "recover",
    "pass-recovery",
    "add-bot",
    "remove-bot",
    "replace",
    "rematch",
    "chat",
  ]),
  role: z.number().int().min(1).max(8).optional(),
  card: z.string().max(80).optional(),
  cards: z.array(z.string().max(80)).max(100).optional(),
  target: z.string().max(80).optional(),
  text: z.string().max(240).optional(),
  version: z.number().int().optional(),
});
