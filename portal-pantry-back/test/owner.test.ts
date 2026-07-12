import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { bearer, createTestApp, customerToken, ownerToken, type TestContext } from "./helpers.js";

describe("owner dashboard", () => {
  let ctx: TestContext;
  let token: string;
  beforeEach(async () => {
    ctx = createTestApp();
    token = await ownerToken(ctx.app);
  });

  it("locks every /owner endpoint to owner accounts", async () => {
    const customer = await customerToken(ctx.app);
    for (const [method, path] of [
      ["get", "/owner/restaurant"],
      ["get", "/owner/orders"],
      ["get", "/owner/finance"],
      ["get", "/owner/reviews"],
    ] as const) {
      await request(ctx.app)[method](path).expect(401);
      await request(ctx.app)[method](path).set(bearer(customer)).expect(403);
    }
  });

  describe("storefront", () => {
    it("edits name and tagline, and validates the name", async () => {
      const res = await request(ctx.app)
        .patch("/owner/restaurant")
        .set(bearer(token))
        .send({ name: "  Neutrino Noodles 2.0 ", tagline: "Now with 40% more phase." })
        .expect(200);
      expect(res.body.restaurant.name).toBe("Neutrino Noodles 2.0");
      expect(res.body.restaurant.tagline).toBe("Now with 40% more phase.");

      await request(ctx.app)
        .patch("/owner/restaurant")
        .set(bearer(token))
        .send({ name: "   " })
        .expect(422);
    });

    it("sets and clears the cover image", async () => {
      const dataUrl = `data:image/webp;base64,${"A".repeat(64)}`;
      const set = await request(ctx.app)
        .patch("/owner/restaurant")
        .set(bearer(token))
        .send({ image: dataUrl })
        .expect(200);
      expect(set.body.restaurant.image).toBe(dataUrl);

      const cleared = await request(ctx.app)
        .patch("/owner/restaurant")
        .set(bearer(token))
        .send({ image: "" })
        .expect(200);
      expect(cleared.body.restaurant.image).toBeUndefined();

      await request(ctx.app)
        .patch("/owner/restaurant")
        .set(bearer(token))
        .send({ image: "javascript:alert(1)" })
        .expect(422);
    });
  });

  describe("menu", () => {
    it("adds a dish (default prep 10) that customers can see", async () => {
      const res = await request(ctx.app)
        .post("/owner/menu-items")
        .set(bearer(token))
        .send({ name: "Tachyon Tea", desc: "Arrives before you order it.", price: 8 })
        .expect(201);
      expect(res.body.item).toMatchObject({ name: "Tachyon Tea", price: 8, prepMinutes: 10, delisted: false });

      const catalog = await request(ctx.app).get("/restaurants").expect(200);
      const neutrino = catalog.body.restaurants.find((r: { id: string }) => r.id === "neutrino");
      expect(neutrino.items.map((i: { name: string }) => i.name)).toContain("Tachyon Tea");
    });

    it("validates new dishes", async () => {
      await request(ctx.app)
        .post("/owner/menu-items")
        .set(bearer(token))
        .send({ desc: "Nameless", price: 8 })
        .expect(422);
      await request(ctx.app)
        .post("/owner/menu-items")
        .set(bearer(token))
        .send({ name: "Free Lunch", price: 0 })
        .expect(422);
    });

    it("edits a dish and enforces ownership", async () => {
      const res = await request(ctx.app)
        .patch("/owner/menu-items/nn1")
        .set(bearer(token))
        .send({ price: 31, prepMinutes: 12.4 })
        .expect(200);
      expect(res.body.item).toMatchObject({ price: 31, prepMinutes: 12 });

      await request(ctx.app)
        .patch("/owner/menu-items/nn1")
        .set(bearer(token))
        .send({ price: -3 })
        .expect(422);
      // gg1 belongs to Greasy Gargantua.
      await request(ctx.app)
        .patch("/owner/menu-items/gg1")
        .set(bearer(token))
        .send({ price: 1 })
        .expect(403);
      await request(ctx.app)
        .patch("/owner/menu-items/nope")
        .set(bearer(token))
        .send({ price: 1 })
        .expect(404);
    });
  });

  describe("orders", () => {
    it("lists the kitchen's orders with per-kitchen subtotals", async () => {
      const res = await request(ctx.app).get("/owner/orders").set(bearer(token)).expect(200);
      const orders = res.body.orders as { id: string; subtotal: number; items: unknown[] }[];
      expect(orders).toHaveLength(8);

      // PP-91443: 2× Pho (29) + 1× Broth (3) = 61 — the kitchen's cut, not the 73 grand total.
      const queueTop = orders.find((o) => o.id === "PP-91443");
      expect(queueTop?.subtotal).toBe(61);
      expect(queueTop?.items).toHaveLength(2);
    });

    it("marks pending orders delivered; refunded orders stay refunded", async () => {
      const res = await request(ctx.app)
        .patch("/owner/orders/PP-91443")
        .set(bearer(token))
        .send({ status: "delivered" })
        .expect(200);
      expect(res.body.order.status).toBe("delivered");

      // Idempotent on repeat.
      await request(ctx.app)
        .patch("/owner/orders/PP-91443")
        .set(bearer(token))
        .send({ status: "delivered" })
        .expect(200);
      // Kitchens can't set anything else.
      await request(ctx.app)
        .patch("/owner/orders/PP-91380")
        .set(bearer(token))
        .send({ status: "lost" })
        .expect(422);
      // PP-90211 was refunded (wrong-dimension) — money already went back.
      await request(ctx.app)
        .patch("/owner/orders/PP-90211")
        .set(bearer(token))
        .send({ status: "delivered" })
        .expect(409);
      await request(ctx.app)
        .patch("/owner/orders/PP-00000")
        .set(bearer(token))
        .send({ status: "delivered" })
        .expect(404);
    });
  });

  describe("finance", () => {
    it("computes the seeded books exactly", async () => {
      const res = await request(ctx.app).get("/owner/finance").set(bearer(token)).expect(200);
      // Delivered subtotals: 116 + 60 + 129 + 82 = 387
      // Pending subtotals:    61 + 75 + 50      = 186
      // Refunded:             58
      expect(res.body.finance).toEqual({
        gross: 387,
        pending: 186,
        refunded: 58,
        deliveredOrders: 4,
        pendingOrders: 3,
        platformFeeRate: 0.15,
        taxRate: 0.08,
        platformFee: 58, // round(387 × 0.15)
        tax: 31, // round(387 × 0.08)
        net: 298, // 387 − 58 − 31
      });
    });

    it("moves money from pending to gross on delivery", async () => {
      await request(ctx.app)
        .patch("/owner/orders/PP-91443")
        .set(bearer(token))
        .send({ status: "delivered" })
        .expect(200);
      const res = await request(ctx.app).get("/owner/finance").set(bearer(token)).expect(200);
      expect(res.body.finance).toMatchObject({
        gross: 448, // 387 + 61
        pending: 125, // 186 − 61
        deliveredOrders: 5,
        pendingOrders: 2,
      });
    });
  });

  describe("reviews", () => {
    it("lists the kitchen's reviews and posts replies", async () => {
      const list = await request(ctx.app).get("/owner/reviews").set(bearer(token)).expect(200);
      expect(list.body.reviews).toHaveLength(5);

      const res = await request(ctx.app)
        .post("/owner/reviews/rev_2/reply")
        .set(bearer(token))
        .send({ reply: "Aw geez Morty, thanks — gyoza clips are on the house next time." })
        .expect(200);
      expect(res.body.review.reply).toContain("gyoza clips");
      expect(res.body.review.repliedAt).toBeTruthy();

      await request(ctx.app)
        .post("/owner/reviews/rev_2/reply")
        .set(bearer(token))
        .send({ reply: "   " })
        .expect(422);
      await request(ctx.app)
        .post("/owner/reviews/rev_ghost/reply")
        .set(bearer(token))
        .send({ reply: "Hello?" })
        .expect(404);
    });
  });
});
