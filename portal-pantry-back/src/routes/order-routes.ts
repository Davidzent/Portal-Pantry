import { Router } from "express";
import type { Db } from "../db/database.js";
import { createOrder, listOrders } from "../services/order-service.js";

/** Customer orders, always scoped to the session user. */
export function createOrderRouter(db: Db): Router {
  const router = Router();

  router.get("/orders", (req, res) => {
    res.json({ orders: listOrders(db, req) });
  });

  router.post("/orders", (req, res) => {
    res.status(201).json({ order: createOrder(db, req, req.body) });
  });

  return router;
}
