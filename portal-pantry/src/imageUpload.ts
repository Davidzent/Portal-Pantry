/**
 * Client-side image processing for owner uploads. Downscales a picked
 * File to a max edge and re-encodes it as a compact WebP data URL — the
 * same treatment the bundled art got, so uploads stay small enough to
 * live in the mock database (localStorage). A dark backdrop is painted
 * first so transparent PNGs match Portal Pantry's theme.
 */

const BACKDROP = "#0b0b12";

export async function fileToWebpDataUrl(
  file: File,
  maxEdge: number,
  quality = 0.8,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas is unavailable in this browser.");
  }
  ctx.fillStyle = BACKDROP;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Prefer WebP; browsers that can't encode it fall back to PNG automatically.
  return canvas.toDataURL("image/webp", quality);
}
