/**
 * Composited behind transparent uploads before re-encoding to WebP, which has
 * no alpha here. Must track `--pp-well` in styles/tokens.css: this colour gets
 * baked into the stored image, so a light value would show as a bright halo on
 * every dark panel it is later placed on. Canvas cannot read a CSS custom property,
 * so this is the one place the token value is duplicated.
 */
const BACKDROP = "#0a0e0f";

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

  return canvas.toDataURL("image/webp", quality);
}
