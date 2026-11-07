import { clearSession, getSession } from "./auth";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Raw text body, for endpoints that take @RequestBody String. */
  text?: string;
  auth?: boolean;
};

/** Calls the API and returns parsed JSON (or text). Throws ApiError with the backend's message. */
export async function api<T = unknown>(path: string, { body, text, auth = true, headers, ...init }: Options = {}): Promise<T> {
  const session = auth ? getSession() : null;
  const res = await fetch(API_URL + path, {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(text !== undefined ? { "Content-Type": "text/plain" } : {}),
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      ...headers,
    },
    body: text ?? (body === undefined ? undefined : JSON.stringify(body)),
  });

  const raw = await res.text();
  let data: unknown = raw;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    /* plain-text response */
  }

  if (!res.ok) {
    if (res.status === 401 && auth && session) {
      clearSession();
      // Outside React: a full reload also drops any cached queries from the old session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (typeof window !== "undefined") window.location.href = "/login?expired=1";
    }
    let message = `Lỗi ${res.status}`;
    if (data && typeof data === "object" && "message" in data) message = String((data as { message: unknown }).message);
    else if (typeof data === "string" && data) message = data;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

/** Downloads a binary file (Excel reports) with the auth header. */
export async function download(path: string, filename: string) {
  const session = getSession();
  const res = await fetch(API_URL + path, {
    headers: session ? { Authorization: `Bearer ${session.token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, `Không tải được file (${res.status})`);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function qs(params: Record<string, string | number | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}
