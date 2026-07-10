import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import type { Logger } from "../logger.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `No such endpoint: ${req.method} ${req.path}`));
};

export function errorHandler(logger?: Logger): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { message: err.message } });
      return;
    }
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      res.status(400).json({ error: { message: "Request body isn't valid JSON." } });
      return;
    }
    if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large") {
      res.status(413).json({
        error: { message: "That payload is too heavy for the wormhole (2 MB max)." },
      });
      return;
    }
    logger?.error(err, "Unhandled error");
    res.status(500).json({
      error: { message: "The backend fell into a wormhole. Try again." },
    });
  };
}
