/**
 * The app's HTTP client. Every feature module calls `api()` exactly the
 * way it would call fetch() against a real backend — method, path, JSON
 * body, bearer token from storage — and gets typed data or an ApiError
 * with a status code.
 *
 * Two interchangeable transports, same contract:
 *  - With `VITE_API_URL` set (see `.env.local`), requests go over real
 *    HTTP to the Node backend in `../portal-pantry-back`.
 *  - Without it, requests route to the in-browser mock server, so the
 *    static demo keeps working with no server at all.
 */

import { handleRequest, HttpError } from "../server";


export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

/** Mirrors an HTTP error response so call sites can branch on status. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const TOKEN_KEY = "pp-auth-token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable — the session lives for this tab only
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // nothing to clear
    }
  },
};

/** Real backend base URL (e.g. http://localhost:4000), set via .env.local. */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");

/** Simulated network latency for the in-browser mock, with a little jitter. */
const latency = () => 320 + Math.random() * 380;

async function mockTransport<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, latency()));
  try {
    const response = handleRequest(method, path, body, tokenStore.get());
    return response.data as T;
  } catch (err) {
    if (err instanceof HttpError) {
      throw new ApiError(err.status, err.message);
    }
    throw new ApiError(500, "The backend fell into a wormhole. Try again.");
  }
}

async function httpTransport<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(503, "Can't reach the backend — is the API server running?");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, message);
  }
  return payload as T;
}

export async function api<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  return API_URL
    ? httpTransport<T>(method, path, body)
    : mockTransport<T>(method, path, body);
}
