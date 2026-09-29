"use client";
import { useSyncExternalStore } from "react";
const EVENT = "citadel-preferences";
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  window.addEventListener("citadel-sound", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("citadel-sound", callback);
  };
}
export function savePreference(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(EVENT));
}
export function usePreference(key: string, fallback = "") {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? fallback,
    () => fallback,
  );
  return [value, (next: string) => savePreference(key, next)] as const;
}
