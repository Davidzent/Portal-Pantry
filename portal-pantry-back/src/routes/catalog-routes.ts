import { Router } from "express";
import type { Db } from "../db/database.js";
import { addReview, listCatalog, listReviews } from "../services/catalog-service.js";

/** Public storefront: the catalog and per-kitchen reviews. */
export function createCatalogRouter(db: Db): Router {
  const router = Router();

  router.get("/restaurants", (_req, res) => {
    res.json({ restaurants: listCatalog(db) });
  });

  router.get("/restaurants/:id/reviews", (req, res) => {
    res.json({ reviews: listReviews(db, req.params.id) });
  });

  router.post("/restaurants/:id/reviews", (req, res) => {
    res.status(201).json({ review: addReview(db, req, req.params.id, req.body) });
  });

  return router;
}
