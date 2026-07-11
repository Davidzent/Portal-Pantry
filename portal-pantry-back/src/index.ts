/**
 * Boot: load config, open + seed the database, start the HTTP server,
 * and shut everything down cleanly on SIGINT/SIGTERM.
 */
import "dotenv/config";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { openDatabase } from "./db/database.js";
import { pruneExpiredSessions } from "./services/auth-service.js";
import { createApp } from "./app.js";

const config = loadConfig();
const logger = createLogger(config);

const db = openDatabase(config.databasePath);

const sweptSessions = pruneExpiredSessions(db);
if (sweptSessions > 0) {
  logger.info({ sweptSessions }, "Pruned expired sessions");
}

const app = createApp({ db, config, logger });
const server = app.listen(config.port, config.host, () => {
  logger.info(`Portal Pantry API listening on http://${config.host}:${config.port}`);
});

let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    db.close();
    process.exit(0);
  });
  // Don't let a lingering keep-alive socket hold the process hostage.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
