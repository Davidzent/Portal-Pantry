
import "dotenv/config";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { openDatabase } from "./db/database.js";
import { seedDatabaseIfEmpty } from "./db/seed.js";
import { pruneExpiredSessions } from "./services/auth-service.js";
import { createApp } from "./app.js";

const config = loadConfig();
const logger = createLogger(config);

const db = openDatabase(config.databasePath);

if (seedDatabaseIfEmpty(db)) {
  logger.info("Seeded demo data into an empty database");
}

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
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
