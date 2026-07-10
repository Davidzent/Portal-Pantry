import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { AppConfig } from "../config.js";
import type { Db } from "../db/database.js";
import { login, logout, me, register } from "../services/auth-service.js";

export function createAuthRouter(db: Db, config: AppConfig): Router {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 5 * 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.env === "test",
    handler: (_req, res) => {
      res.status(429).json({
        error: { message: "Too many attempts — give the portal a minute and try again." },
      });
    },
  });

  router.post("/login", limiter, async (req, res) => {
    res.json(await login(db, config, req.body));
  });

  router.post("/register", limiter, async (req, res) => {
    res.status(201).json(await register(db, config, req.body));
  });

  router.get("/me", (req, res) => {
    res.json({ user: me(db, req) });
  });

  router.post("/logout", (req, res) => {
    res.json(logout(db, req));
  });

  return router;
}
