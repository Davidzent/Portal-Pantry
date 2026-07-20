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
  restaurantId?: string;
  restaurantName?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<User> {
  const response = await api<LoginResponse>("POST", "/auth/login", {
    email,
    password,
  });
  tokenStore.set(response.token);
  return response.user;
}

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

export async function logout(): Promise<void> {
  try {
    await api("POST", "/auth/logout");
  } finally {
    tokenStore.clear();
  }
}
