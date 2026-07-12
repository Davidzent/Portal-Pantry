import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { bearer, createTestApp, customerToken, ownerToken, type TestContext } from "./helpers.js";

describe("public catalog", () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = createTestApp();
  });

  it("serves the seeded catalog with menus", async () => {
    const res = await request(ctx.app).get("/restaurants").expect(200);
    const restaurants = res.body.restaurants as {
      id: string;
      items: { id: string; restaurantId?: string }[];
    }[];

    expect(restaurants).toHaveLength(10);
    const neutrino = restaurants.find((r) => r.id === "neutrino");
    expect(neutrino?.items.map((i) => i.id)).toEqual(["nn1", "nn2", "nn3", "nn4"]);
    // Line items don't leak the internal FK — same shape the mock served.
    expect(neutrino?.items[0]).not.toHaveProperty("restaurantId");
  });

  it("hides delisted dishes from customers but not from the owner", async () => {
    const token = await ownerToken(ctx.app);
    await request(ctx.app)
      .patch("/owner/menu-items/nn4")
      .set(bearer(token))
      .send({ delisted: true })
      .expect(200);

    const publicCatalog = await request(ctx.app).get("/restaurants").expect(200);
    const publicNeutrino = publicCatalog.body.restaurants.find(
      (r: { id: string }) => r.id === "neutrino",
    );
    expect(publicNeutrino.items.map((i: { id: string }) => i.id)).toEqual(["nn1", "nn2", "nn3"]);

    const ownerView = await request(ctx.app)
      .get("/owner/restaurant")
      .set(bearer(token))
      .expect(200);
    const ownerItems = ownerView.body.restaurant.items as { id: string; delisted: boolean }[];
    expect(ownerItems).toHaveLength(4);
    expect(ownerItems.find((i) => i.id === "nn4")?.delisted).toBe(true);
  });
});

describe("reviews", () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = createTestApp();
  });

  it("lists a kitchen's reviews newest first", async () => {
    const res = await request(ctx.app).get("/restaurants/neutrino/reviews").expect(200);
    const reviews = res.body.reviews as { id: string; createdAt: string }[];
    expect(reviews).toHaveLength(5);
    const timestamps = reviews.map((r) => r.createdAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it("lets a customer post a review and recomputes the rating", async () => {
    const token = await customerToken(ctx.app);
    const res = await request(ctx.app)
      .post("/restaurants/neutrino/reviews")
      .set(bearer(token))
      .send({ rating: 1, body: "The noodles phased through my fork. One star." })
      .expect(201);
    expect(res.body.review).toMatchObject({ rating: 1, author: "Zoe Traveler" });

    // Seeded ratings: 5+4+5+3+4; with the new 1 → 22/6 = 3.666… → 3.7
    const catalog = await request(ctx.app).get("/restaurants").expect(200);
    const neutrino = catalog.body.restaurants.find((r: { id: string }) => r.id === "neutrino");
    expect(neutrino.rating).toBe(3.7);
  });

  it("rejects owners, bad ratings, empty bodies, and unknown kitchens", async () => {
    const owner = await ownerToken(ctx.app);
    await request(ctx.app)
      .post("/restaurants/neutrino/reviews")
      .set(bearer(owner))
      .send({ rating: 5, body: "My own kitchen is great." })
      .expect(403);

    const customer = await customerToken(ctx.app);
    await request(ctx.app)
      .post("/restaurants/neutrino/reviews")
      .set(bearer(customer))
      .send({ rating: 0, body: "Zero stars!" })
      .expect(422);
    await request(ctx.app)
      .post("/restaurants/neutrino/reviews")
      .set(bearer(customer))
      .send({ rating: 4, body: "   " })
      .expect(422);
    await request(ctx.app)
      .post("/restaurants/ghost-kitchen/reviews")
      .set(bearer(customer))
      .send({ rating: 4, body: "Spooky." })
      .expect(404);
  });
});
