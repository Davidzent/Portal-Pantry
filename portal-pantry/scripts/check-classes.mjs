/**
 * Find `pp-*` class names used in markup that no stylesheet defines.
 *
 *   node scripts/check-classes.mjs
 *
 * The first-pass stylesheet had five of these rotting in it unnoticed, and the
 * dark rewrite introduced four more by renaming classes without touching the
 * markup. Cheap to check, so check it.
 *
 * Screens still on provisional styling are reported separately — their old
 * class names are expected to be unstyled until each gets its own pass.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = fileURLToPath(new URL("../src/app", import.meta.url));
const styleDir = join(appDir, "styles");

const REDESIGNED = new Set([
  "PantryApp.tsx",
  "Manifest.tsx",
  "RestaurantModal.tsx",
  "LoginModal.tsx",
  "CheckoutModal.tsx",
  "OrderHistoryModal.tsx",
  "CartDrawer.tsx",
  "Portal.tsx",
  "Stars.tsx",
  "Icon.tsx",
  "PortalMark.tsx",
]);

/* Structural hooks that intentionally carry no styles: a wrapper that exists
   only to be made `inert`, and a grid child that needs no rules of its own. */
const STRUCTURAL = new Set(["pp-app", "pp-board__main"]);

const css = readdirSync(styleDir)
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(join(styleDir, f), "utf8"))
  .join("\n");

const defined = new Set(
  [...css.matchAll(/\.(pp-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]),
);

const used = new Map();
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "styles") walk(p);
    } else if (entry.name.endsWith(".tsx")) {
      const src = readFileSync(p, "utf8");
      for (const m of src.matchAll(/className=[{"`]([^"`}]*)/g)) {
        for (const c of m[1].split(/[^a-zA-Z0-9_-]+/)) {
          if (c.startsWith("pp-") && !used.has(c)) used.set(c, basename(p));
        }
      }
    }
  }
}
walk(appDir);

const missing = [...used].filter(
  ([cls]) => !defined.has(cls) && !STRUCTURAL.has(cls),
);
const inRedesigned = missing.filter(([, file]) => REDESIGNED.has(file));
const inPending = missing.filter(([, file]) => !REDESIGNED.has(file));

console.log(`${used.size} pp-* classes in markup, ${defined.size} defined in CSS`);
console.log("\nRedesigned screens:");
console.log(
  inRedesigned.length
    ? inRedesigned.map(([c, f]) => `  UNSTYLED .${c}  <- ${f}`).join("\n")
    : "  clean — every class resolves",
);

const pendingFiles = [...new Set(inPending.map(([, f]) => f))];
console.log(
  `\nPending screens (provisional styling, expected): ${inPending.length} classes across ${pendingFiles.join(", ") || "none"}`,
);

process.exit(inRedesigned.length ? 1 : 0);
