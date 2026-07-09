/**
 * The app's HTTP client. Every feature module calls `api()` exactly the
 * way it would call fetch() against a real backend — method, path, JSON
 * body, bearer token from storage — and gets typed data or an ApiError
 * with a status code. The transport currently routes to the in-browser
 * mock server; point it at a real base URL and the app ships as-is.
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

/** Simulated network latency with a little jitter. */
const latency = () => 320 + Math.random() * 380;

export async function api<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
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
