import { pino, type Logger } from "pino";
import type { AppConfig } from "./config.js";

export type { Logger };

export function createLogger(config: AppConfig): Logger {
  return pino({
    level: config.logLevel,
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
