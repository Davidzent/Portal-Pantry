import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { bearer, createTestApp, type TestContext } from "./helpers.js";

describe("auth", () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = createTestApp();
  });

  describe("POST /auth/register", () => {
    it("creates a customer account and signs it in", async () => {
      const res = await request(ctx.app)
        .post("/auth/register")
        .send({ email: "zoe.traveler-42@test.pp", password: "s3cret", role: "customer" })
        .expect(201);

      expect(res.body.token).toMatch(/^pp_/);
      expect(res.body.user).toMatchObject({
        email: "zoe.traveler-42@test.pp",
        name: "Zoe Traveler", // derived from the email
        role: "customer",
        memberSince: "2847",
      });
      expect(res.body.user.restaurantId).toBeUndefined();
      expect(res.body.user).not.toHaveProperty("password_hash");
      expect(res.body.user).not.toHaveProperty("passwordHash");
    });

    it("creates an owner account with a brand-new kitchen", async () => {
      const res = await request(ctx.app)
        .post("/auth/register")
        .send({
          email: "chef@fresh.pp",
          password: "s3cret",
          name: "Chef Zorp",
          role: "owner",
          restaurantName: "Zorp's Test Kitchen",
        })
        .expect(201);

      expect(res.body.user.role).toBe("owner");
      expect(res.body.user.restaurantId).toBeTruthy();
      expect(res.body.user.restaurantName).toBe("Zorp's Test Kitchen");

      // The new kitchen is instantly in the public catalog.
      const catalog = await request(ctx.app).get("/restaurants").expect(200);
      const names = catalog.body.restaurants.map((r: { name: string }) => r.name);
      expect(names).toContain("Zorp's Test Kitchen");
    });

    it("rejects owners without a kitchen name", async () => {
      const res = await request(ctx.app)
        .post("/auth/register")
        .send({ email: "chef@fresh.pp", password: "s3cret", role: "owner" })
        .expect(422);
      expect(res.body.error.message).toBe("Your kitchen needs a name.");
    });

    it("rejects malformed emails, short passwords, and duplicates", async () => {
      await request(ctx.app)
        .post("/auth/register")
        .send({ email: "not-an-email", password: "s3cret" })
        .expect(422);
      await request(ctx.app)
        .post("/auth/register")
        .send({ email: "ok@test.pp", password: "abc" })
        .expect(422);
      await request(ctx.app)
        .post("/auth/register")
        .send({ email: "owner@neutrino.pp", password: "s3cret" })
        .expect(409);
    });
  });

  describe("POST /auth/login", () => {
    it("signs the demo owner in with any 4+ character password", async () => {
      const res = await request(ctx.app)
        .post("/auth/login")
        .send({ email: "owner@neutrino.pp", password: "whatever" })
        .expect(200);
      expect(res.body.user).toMatchObject({
        role: "owner",
        restaurantId: "neutrino",
        restaurantName: "Neutrino Noodles",
      });
    });

    it("verifies real passwords for registered accounts", async () => {
      await request(ctx.app)
        .post("/auth/register")
        .send({ email: "zoe@test.pp", password: "right-one" })
        .expect(201);

      await request(ctx.app)
        .post("/auth/login")
        .send({ email: "zoe@test.pp", password: "wrong-one" })
        .expect(401);
      await request(ctx.app)
        .post("/auth/login")
        .send({ email: "zoe@test.pp", password: "right-one" })
        .expect(200);
    });

    it("distinguishes bad email (422), short password (401), unknown account (404)", async () => {
      await request(ctx.app)
        .post("/auth/login")
        .send({ email: "not-an-email", password: "s3cret" })
        .expect(422);
      await request(ctx.app)
        .post("/auth/login")
        .send({ email: "owner@neutrino.pp", password: "abc" })
        .expect(401);
      await request(ctx.app)
        .post("/auth/login")
        .send({ email: "nobody@nowhere.pp", password: "s3cret" })
        .expect(404);
    });
  });

  describe("sessions", () => {
    it("GET /auth/me restores the session; logout revokes it", async () => {
      const login = await request(ctx.app)
        .post("/auth/login")
        .send({ email: "owner@neutrino.pp", password: "noodles" })
        .expect(200);
      const token = login.body.token as string;

      const me = await request(ctx.app).get("/auth/me").set(bearer(token)).expect(200);
      expect(me.body.user.email).toBe("owner@neutrino.pp");

      await request(ctx.app).post("/auth/logout").set(bearer(token)).expect(200);
      await request(ctx.app).get("/auth/me").set(bearer(token)).expect(401);
    });

    it("rejects missing and garbage tokens", async () => {
      await request(ctx.app).get("/auth/me").expect(401);
      await request(ctx.app).get("/auth/me").set(bearer("pp_forged")).expect(401);
    });
  });
});
