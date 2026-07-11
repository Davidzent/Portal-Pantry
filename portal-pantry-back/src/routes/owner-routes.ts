import { Router } from "express";
import type { Db } from "../db/database.js";
import {
  createMenuItem,
  getFinance,
  getRestaurant,
  listOwnerOrders,
  listOwnerReviews,
  markOrderDelivered,
  replyToReview,
  updateMenuItem,
  updateRestaurant,
} from "../services/owner-service.js";

/** Everything behind the owner dashboard. Mounted at /owner. */
export function createOwnerRouter(db: Db): Router {
  const router = Router();

  router.get("/restaurant", (req, res) => {
    res.json({ restaurant: getRestaurant(db, req) });
  });

  router.patch("/restaurant", (req, res) => {
    res.json({ restaurant: updateRestaurant(db, req, req.body) });
  });

  router.post("/menu-items", (req, res) => {
    res.status(201).json({ item: createMenuItem(db, req, req.body) });
  });

  router.patch("/menu-items/:id", (req, res) => {
    res.json({ item: updateMenuItem(db, req, req.params.id, req.body) });
  });

  router.get("/orders", (req, res) => {
    res.json({ orders: listOwnerOrders(db, req) });
  });

  router.patch("/orders/:id", (req, res) => {
    res.json({ order: markOrderDelivered(db, req, req.params.id, req.body) });
  });

  router.get("/finance", (req, res) => {
    res.json({ finance: getFinance(db, req) });
  });

  router.get("/reviews", (req, res) => {
    res.json({ reviews: listOwnerReviews(db, req) });
  });

  router.post("/reviews/:id/reply", (req, res) => {
    res.json({ review: replyToReview(db, req, req.params.id, req.body) });
  });

  return router;
}
