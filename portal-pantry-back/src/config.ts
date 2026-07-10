/**
 * Environment-driven configuration, validated up front with zod so a
 * typo'd variable fails the boot loudly instead of misbehaving quietly.
 */
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(4000),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_PATH: z.string().default("data/portal-pantry.sqlite"),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(720),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  TRUST_PROXY: z
    .enum(["true", "false", "1", "0"])
    .default("false")
    .transform((v) => v === "true" || v === "1"),
});

export interface AppConfig {
  env: "development" | "test" | "production";
  port: number;
  host: string;
  databasePath: string;
  /** Allowed browser origins, or "*" to disable the origin check. */
  corsOrigins: string[] | "*";
  sessionTtlMs: number;
  logLevel: string;
  trustProxy: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${details}`);
  }
  const e = parsed.data;
  const origins = e.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return {
    env: e.NODE_ENV,
    port: e.PORT,
    host: e.HOST,
    databasePath: e.DATABASE_PATH,
    corsOrigins: origins.includes("*") ? "*" : origins,
    sessionTtlMs: e.SESSION_TTL_HOURS * 3_600_000,
    logLevel: e.LOG_LEVEL,
    trustProxy: e.TRUST_PROXY,
  };
}
