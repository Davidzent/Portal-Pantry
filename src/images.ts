/**
 * Resolves the image *key* stored in the catalog (e.g. "phase_through_pho")
 * to a hashed, bundled asset URL. Vite fingerprints every file under
 * assets/portal-pantry via import.meta.glob, so the "database" only ever
 * stores a stable key — exactly how a real backend stores a filename.
 */

const modules = import.meta.glob("./assets/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop() ?? "";
  byKey[file.replace(/\.webp$/, "")] = url;
}

/**
 * Resolves an image reference to a usable URL. Owner-uploaded images are
 * stored as data URLs (or absolute URLs) and pass straight through;
 * everything else is treated as a bundled-asset key.
 */
export function imageUrl(key?: string): string | undefined {
  if (!key) return undefined;
  if (/^(data:|https?:|\/)/.test(key)) return key;
  return byKey[key];
}
