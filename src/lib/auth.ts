import type { Role } from "./types";

const TOKEN_KEY = "bb_token";

export type Session = { token: string; email: string; role: Role; exp: number };

function decode(token: string): { sub: string; role: string; exp: number } | null {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(part)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
  if (!token) return null;
  const claims = decode(token);
  if (!claims || claims.exp * 1000 < Date.now()) {
    clearSession();
    return null;
  }
  return { token, email: claims.sub, role: claims.role.replace(/^ROLE_/, "") as Role, exp: claims.exp };
}

export function saveToken(token: string): Session | null {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage blocked: session lives only for this page */
  }
  return getSession();
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export const homeFor: Record<Role, string> = {
  ADMIN: "/admin",
  STAFF_TECH: "/staff",
  STAFF_INVENTORY: "/staff",
  HOSPITAL: "/hospital",
  DONOR: "/donor",
};
