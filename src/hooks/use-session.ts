"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getSession, type Session } from "@/lib/auth";

const listeners = new Set<() => void>();

/** Tell subscribers the stored token changed (login / logout in this tab). */
export function notifySessionChange() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function snapshot() {
  return getSession()?.token ?? null;
}

/** undefined while rendering on the server / before hydration, null when logged out. */
export function useSession(): Session | null | undefined {
  const token = useSyncExternalStore(subscribe, snapshot, () => undefined);
  return useMemo(() => (token === undefined ? undefined : token ? getSession() : null), [token]);
}
