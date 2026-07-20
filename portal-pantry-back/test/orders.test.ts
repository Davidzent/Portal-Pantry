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
        items: [{ restaurantId: "neutrino", itemId: "nn1", qty: 2 }],
        dimension: "Ω-77",
      })
      .expect(201);

    expect(res.body.order.id).toMatch(/^PP-\d{5}$/);
    expect(res.body.order.status).toBe("pending");
    // Priced from the catalog: 2 × Phase-Through Pho (29ƶ) + 12ƶ portal toll.
    expect(res.body.order.total).toBe(70);

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
      .send({ items: [{ restaurantId: "neutrino", itemId: "nn1", qty: 1 }] })
      .expect(403);

    const customer = await customerToken(ctx.app);
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({ items: [] })
      .expect(422);
    // A dish that doesn't exist in this reality.
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({ items: [{ restaurantId: "neutrino", itemId: "ghost-dish", qty: 1 }] })
      .expect(422);
    // A real dish paired with the wrong kitchen.
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({ items: [{ restaurantId: "gargantua", itemId: "nn1", qty: 1 }] })
      .expect(422);
  });
});

describe("server-side pricing", () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = createTestApp();
  });

  it("computes the total from the catalog and ignores client math", async () => {
    const token = await customerToken(ctx.app);
    const res = await request(ctx.app)
      .post("/orders")
      .set(bearer(token))
      .send({
        // The client claims everything is nearly free. The kitchen disagrees.
        items: [
          { restaurantId: "neutrino", itemId: "nn1", qty: 2, price: 0.01 },
          { restaurantId: "neutrino", itemId: "nn2", qty: 1, price: 0.01 },
        ],
        total: 1,
        dimension: "Ω-77",
      })
      .expect(201);

    // 2 × Pho (29ƶ) + 1 × Gyoza (21ƶ) + 12ƶ portal toll = 91ƶ.
    expect(res.body.order.total).toBe(91);
    const prices = (res.body.order.items as { name: string; price: number }[]).map(
      (i) => [i.name, i.price],
    );
    expect(prices).toEqual([
      ["Phase-Through Pho", 29],
      ["Zero-G Gyoza", 21],
    ]);
  });

  it("matches the cart to the last ƶ across dimensions", async () => {
    const token = await customerToken(ctx.app);
    const carts: { items: { restaurantId: string; itemId: string; qty: number }[]; dimension: string; expected: number }[] = [
      { items: [{ restaurantId: "gargantua", itemId: "gg1", qty: 1 }], dimension: "C-131", expected: 45 + 12 },
      { items: [{ restaurantId: "quantum-q", itemId: "qq1", qty: 2 }], dimension: "Ω-77", expected: 64 + 12 },
      { items: [{ restaurantId: "zorp", itemId: "gz2", qty: 1 }], dimension: "B-612", expected: 33 + 12 },
      { items: [{ restaurantId: "brined-one", itemId: "bo1", qty: 3 }], dimension: "Pickle-9", expected: 72 + 12 },
    ];
    for (const cart of carts) {
      const res = await request(ctx.app)
        .post("/orders")
        .set(bearer(token))
        .send({ items: cart.items, dimension: cart.dimension })
        .expect(201);
      expect(res.body.order.total).toBe(cart.expected);
      expect(res.body.order.dimension).toBe(cart.dimension);
    }
  });

  it("refuses delisted dishes", async () => {
    const owner = await ownerToken(ctx.app);
    await request(ctx.app)
      .patch("/owner/menu-items/nn4")
      .set(bearer(owner))
      .send({ delisted: true })
      .expect(200);

    const customer = await customerToken(ctx.app);
    await request(ctx.app)
      .post("/orders")
      .set(bearer(customer))
      .send({ items: [{ restaurantId: "neutrino", itemId: "nn4", qty: 1 }] })
      .expect(422);
  });
});
