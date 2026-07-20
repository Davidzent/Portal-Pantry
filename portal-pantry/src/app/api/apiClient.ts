import { handleRequest, HttpError } from "../server";


export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

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
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
    }
  },
};

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "");

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
