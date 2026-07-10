import { z } from "zod";
import { HttpError } from "./http-error.js";

export function parseBody<Schema extends z.ZodType>(
  schema: Schema,
  body: unknown,
): z.output<Schema> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") ?? "";
    const message = issue?.message ?? "Invalid request body.";
    throw new HttpError(422, path ? `${path}: ${message}` : message);
  }
  return result.data;
}

const IMAGE_KEY_RE = /^[a-z0-9_-]{1,64}$/i;
const DATA_URL_RE = /^data:image\/(webp|png|jpe?g|gif|avif);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 1_500_000;

export const imageField = z
  .string()
  .max(MAX_IMAGE_CHARS, "That image is too heavy for the wormhole — keep it under ~1 MB.")
  .refine(
    (value) => value === "" || IMAGE_KEY_RE.test(value) || DATA_URL_RE.test(value),
    "Images must be an uploaded picture (data URL) or a known art key.",
  );
