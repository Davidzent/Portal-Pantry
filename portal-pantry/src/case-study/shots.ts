/**
 * Real screenshots of the demo app, captured by scripted Chrome at a fixed
 * 1280×832 viewport (@1.5x → 1920×1248, aspect 20:13). Referenced from
 * src/data/portalPantry.ts by key, e.g. "05-cart".
 */
const modules = import.meta.glob("./shots/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop() ?? "";
  byKey[file.replace(/\.webp$/, "")] = url;
}

export const SHOT_WIDTH = 1920;
export const SHOT_HEIGHT = 1248;

export function shotUrl(key: string): string {
  const url = byKey[key];
  if (!url && import.meta.env.DEV) {
    console.warn(`[case-study] missing screenshot: ${key}`);
  }
  return url ?? "";
}
