import { createHash, randomBytes, randomInt } from "node:crypto";

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

export function newOrderNumber(): string {
  return `PP-${randomInt(10_000, 100_000)}`;
}

export function newSessionToken(): string {
  return `pp_${randomBytes(32).toString("base64url")}`;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
