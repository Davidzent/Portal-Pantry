const modules = import.meta.glob("./assets/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop() ?? "";
  byKey[file.replace(/\.webp$/, "")] = url;
}

export function imageUrl(key?: string): string | undefined {
  if (!key) return undefined;
  if (/^(data:|https?:|\/)/.test(key)) return key;
  return byKey[key];
}
