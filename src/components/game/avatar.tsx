"use client";
const PALETTE = [
  "#2f6b52",
  "#9a6a3a",
  "#6d5a8e",
  "#a0473d",
  "#3f6f8c",
  "#8a7a2e",
  "#4f7d3a",
  "#8c4f6d",
];
export function playerColor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export function Avatar({
  id,
  name,
  online,
  size = 32,
}: {
  id: string;
  name: string;
  online?: boolean;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="player-avatar"
      style={
        {
          "--avatar": playerColor(id),
          width: size,
          height: size,
          fontSize: size * 0.38,
        } as React.CSSProperties
      }
    >
      {initials || "?"}
      {online !== undefined && (
        <i
          className={online ? "online" : "away"}
          aria-label={online ? "Online" : "Away"}
        />
      )}
    </span>
  );
}
