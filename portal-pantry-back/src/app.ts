import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { AppConfig } from "./config.js";
import type { Db } from "./db/database.js";
import type { Logger } from "./logger.js";
import { createAuthRouter } from "./routes/auth-routes.js";


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
        redact: ["req.headers.authorization"],
      }),
    );
  }
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "portal-pantry-api", uptime: process.uptime() });
  });

  app.use("/auth", createAuthRouter(db, config));



  return app;
}
