"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = url ? new ConvexReactClient(url) : null;

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!client)
    return (
      <main className="game-error">
        <h1>The realm is not configured.</h1>
        <p>
          Set <code>NEXT_PUBLIC_CONVEX_URL</code> to your Convex deployment URL
          and redeploy.
        </p>
      </main>
    );
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
