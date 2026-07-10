/**
 * Auth SDK — thin, typed wrappers over the API. The backend owns every
 * account detail: role, avatar, and (for owners) which kitchen the
 * account manages. The client never decides any of that.
 */

import { api, ApiError, tokenStore } from "./apiClient";

export { ApiError };

export type UserRole = "customer" | "owner";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  dimension: string;
  memberSince: string;
  role: UserRole;
  /** Present on owner accounts — assigned by the backend. */
  restaurantId?: string;
  /** Joined in by the backend for convenience. */
  restaurantName?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * POST /auth/login. The account must already exist (register otherwise);
 * the backend returns whatever role and kitchen the database has on file.
 */
export async function login(email: string, password: string): Promise<User> {
  const response = await api<LoginResponse>("POST", "/auth/login", {
    email,
    password,
  });
  tokenStore.set(response.token);
  return response.user;
}

/**
 * POST /auth/register. Creates the account (and, for owners, a brand-new
 * restaurant named `restaurantName`) and signs the user in.
 */
export async function register(
  email: string,
  password: string,
  opts: { name?: string; role: UserRole; restaurantName?: string },
): Promise<User> {
  const response = await api<LoginResponse>("POST", "/auth/register", {
    email,
    password,
    name: opts.name,
    role: opts.role,
    restaurantName: opts.restaurantName,
  });
  tokenStore.set(response.token);
  return response.user;
}

/** GET /auth/me — restores the session behind the stored token, if valid. */
export async function getMe(): Promise<User | null> {
  if (!tokenStore.get()) return null;
  try {
    const response = await api<{ user: User }>("GET", "/auth/me");
    return response.user;
  } catch {
    tokenStore.clear();
    return null;
  }
}

/** POST /auth/logout. */
export async function logout(): Promise<void> {
  try {
    await api("POST", "/auth/logout");
  } finally {
    tokenStore.clear();
  }
}
