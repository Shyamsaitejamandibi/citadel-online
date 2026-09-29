"use client";
import { useSyncExternalStore } from "react";
const KEY = "citadel-session";
const noop = () => () => {};
// A private random token identifying this browser's seats. Only its hash is
// ever shown to other players.
function token() {
  let value = localStorage.getItem(KEY);
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    value = crypto.randomUUID();
    localStorage.setItem(KEY, value);
  }
  return value;
}
export function useSession(): string | null {
  return useSyncExternalStore(noop, token, () => null);
}
