import { GameTable } from "@/components/game/game-table";
export const metadata = { title: "Your table" };
export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <GameTable code={code.toUpperCase()} />;
}
