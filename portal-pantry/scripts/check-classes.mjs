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
  "OwnerDashboard.tsx",
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

/* Two passes, because the two questions want opposite error biases.

   `used` is strict — only what appears in a `className` attribute — so the
   "this class has no CSS" report does not fill up with element ids and other
   pp-prefixed strings.

   `mentioned` is loose: every pp-* token anywhere in the source. The dead-CSS
   report needs to be generous about what counts as a use, or class names built
   in template literals, ternaries and array joins get reported as unused. */
const used = new Map();
const mentioned = new Set();

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
      for (const m of src.matchAll(/\bpp-[a-zA-Z0-9_-]+/g)) mentioned.add(m[0]);
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

/* The reverse direction: rules no stylesheet consumer references any more.
   Every screen is redesigned now, so leftovers from earlier passes are simply
   dead weight in the bundle. */
const unused = [...defined].filter((cls) => !mentioned.has(cls)).sort();
console.log(`\nDefined but never used in markup: ${unused.length}`);
for (const cls of unused) console.log(`  .${cls}`);

process.exit(inRedesigned.length ? 1 : 0);
