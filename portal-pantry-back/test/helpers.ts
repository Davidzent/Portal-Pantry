
import type { Express } from "express";
import request from "supertest";
import type { AppConfig } from "../src/config.js";
import { openDatabase, type Db } from "../src/db/database.js";
import { seedDatabaseIfEmpty } from "../src/db/seed.js";
import { createApp } from "../src/app.js";

const testConfig: AppConfig = {
  env: "test",
  port: 0,
  host: "127.0.0.1",
  databasePath: ":memory:",
  corsOrigins: ["http://localhost:5173"],
  sessionTtlMs: 60 * 60_000,
  logLevel: "silent",
  trustProxy: false,
};

export interface TestContext {
  app: Express;
  db: Db;
}

export function createTestApp(): TestContext {
  const db = openDatabase(":memory:");
  seedDatabaseIfEmpty(db);
  return { app: createApp({ db, config: testConfig }), db };
}

/** Signs in the seeded demo owner (Neutrino Noodles). */
export async function ownerToken(app: Express): Promise<string> {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "owner@neutrino.pp", password: "noodles" })
    .expect(200);
  return res.body.token as string;
}

/** Registers a brand-new customer and returns their token. */
export async function customerToken(
  app: Express,
  email = "zoe.traveler@test.pp",
): Promise<string> {
  const res = await request(app)
    .post("/auth/register")
    .send({ email, password: "s3cret", role: "customer" })
    .expect(201);
  return res.body.token as string;
}

export const bearer = (token: string): Record<string, string> => ({
  Authorization: `Bearer ${token}`,
});
