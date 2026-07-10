/**
 * The Express app, assembled from explicit dependencies (db, config,
 * optional logger) so tests can build one against an in-memory database
 * with zero environment coupling.
 */
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { AppConfig } from "./config.js";
import type { Db } from "./db/database.js";
import type { Logger } from "./logger.js";

export interface AppDeps {
  db: Db;
  config: AppConfig;
  logger?: Logger;
}

export function createApp({ db, config, logger }: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins === "*" ? true : config.corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86_400,
    }),
  );
  if (logger) {
    app.use(
      pinoHttp({
        logger,
        // Bearer tokens must never end up in log files.
        redact: ["req.headers.authorization"],
      }),
    );
  }
  // 2 MB leaves room for the client's compact WebP data-URL uploads.
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "portal-pantry-api", uptime: process.uptime() });
  });


  return app;
}
