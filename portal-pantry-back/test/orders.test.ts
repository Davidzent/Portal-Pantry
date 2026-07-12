import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { bearer, createTestApp, customerToken, ownerToken, type TestContext } from "./helpers.js";

describe("customer orders", () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = createTestApp();
  });

  it("new customers get their welcome history, newest first", async () => {
    const token = await customerToken(ctx.app);
    const res = await request(ctx.app).get("/orders").set(bearer(token)).expect(200);
    const orders = res.body.orders as { placedAt: string; status: string }[];

    expect(orders).toHaveLength(4);
    expect(orders.map((o) => o.status)).toEqual([
      "delivered",
      "delivered",
      "wrong-dimension",
      "lost",
    ]);
    const timestamps = orders.map((o) => o.placedAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it("places an order and scopes history to the session user", async () => {
    const token = await customerToken(ctx.app);
    const res = await request(ctx.app)
      .post("/orders")
      .set(bearer(token))
      .send({
        items: [
          { restaurantId: "neutrino", name: "Phase-Through Pho", emoji: "🍜", qty: 2, price: 29, restaurant: "Neutrino Noodles" },
        ],
        total: 70,
        dimension: "Ω-77",
      })
      .expect(201);

    expect(res.body.order.id).toMatch(/^PP-\d{5}$/);
    expect(res.body.order.status).toBe("pending");

    const mine = await request(ctx.app).get("/orders").set(bearer(token)).expect(200);
    expect(mine.body.orders).toHaveLength(5);
    expect(mine.body.orders[0].id).toBe(res.body.order.id);

    // A different customer never sees it.
    const other = await customerToken(ctx.app, "other.traveler@test.pp");
    const theirs = await request(ctx.app).get("/orders").set(bearer(other)).expect(200);
    const theirIds = theirs.body.orders.map((o: { id: string }) => o.id);
    expect(theirIds).not.toContain(res.body.order.id);
  });

  it("keeps owners, anonymous users, and junk orders out", async () => {
    await request(ctx.app).get("/orders").expect(401);

    const owner = await ownerToken(ctx.app);
    await request(ctx.app)
      .post("/orders")
      .set(bearer(owner))
      .send({ items: [{ restaurantId: "neutrino", name: "Pho", emoji: "🍜", qty: 1, price: 29, restaurant: "Neutrino Noodles" }], total: 41 })
      .expect(403);

    const customer = await customerToken(ctx.app);
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({ items: [], total: 10 })
      .expect(422);
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({
        items: [{ restaurantId: "neutrino", name: "Pho", emoji: "🍜", qty: 1, price: 29, restaurant: "Neutrino Noodles" }],
        total: -5,
      })
      .expect(422);
    // A kitchen that doesn't exist in this reality.
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({
        items: [{ restaurantId: "ghost-kitchen", name: "Ectoplasm Soup", emoji: "👻", qty: 1, price: 10, restaurant: "Ghost Kitchen" }],
        total: 22,
      })
      .expect(422);
  });
});
