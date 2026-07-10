import { pino, type Logger } from "pino";
import type { AppConfig } from "./config.js";

export type { Logger };

export function createLogger(config: AppConfig): Logger {
  return pino({
    level: config.logLevel,
    // Pretty output is a dev nicety; production stays newline-delimited JSON.
    ...(config.env === "development"
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
          },
        }
      : {}),
  });
}
