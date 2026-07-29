/**
 * Capture the README screenshots.
 *
 *   npm run dev                      # in another terminal
 *   node scripts/screenshots.mjs     # writes ../docs/*.png
 *
 * Drives headless Chrome over the DevTools Protocol. No dependencies: Node 22+
 * has both `fetch` and a global `WebSocket`, which is all CDP needs. That keeps
 * a ~300MB Playwright install out of a repo whose whole point is that it has
 * almost no dependencies.
 *
 * Each shot declares its own viewport and a `setup` function that drives the UI
 * to the state worth photographing, so re-running this after a design change
 * regenerates every image consistently.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.PP_URL ?? "http://localhost:5173/portal-pantry/";
const OUT = fileURLToPath(new URL("../../docs", import.meta.url));
const PORT = 9333;

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- Recipes ------------------------------------------------------------
   `js` strings run in the page. They are plain expressions evaluated with
   awaitPromise, so returning a promise makes the runner wait for it. */

const setValue = `
const setValue = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, "value").set;
  setter.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
};`;

const waitFor = `
const waitFor = async (sel, ms = 8000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const el = document.querySelector(sel);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 60));
  }
  throw new Error("timed out waiting for " + sel);
};`;

const prelude = `${setValue}\n${waitFor}`;

const signIn = (email, password) => `(async () => {
  ${prelude}
  const btn = [...document.querySelectorAll(".pp-topbar button")].find(b => /Sign in/.test(b.textContent));
  if (!btn) return "already signed in";
  btn.click();
  await waitFor(".pp-auth input");
  const ins = [...document.querySelectorAll(".pp-auth input")];
  setValue(ins[0], ${JSON.stringify(email)});
  setValue(ins[1], ${JSON.stringify(password)});
  document.querySelector(".pp-auth form").requestSubmit();
  await new Promise(r => setTimeout(r, 900));
  return "signed in";
})()`;

const registerCustomer = `(async () => {
  ${prelude}
  const btn = [...document.querySelectorAll(".pp-topbar button")].find(b => /Sign in/.test(b.textContent));
  if (!btn) return "already signed in";
  btn.click();
  await waitFor(".pp-auth .pp-segment button");
  [...document.querySelectorAll(".pp-auth .pp-segment button")].find(b => /New account/.test(b.textContent)).click();
  await new Promise(r => setTimeout(r, 120));
  const ins = [...document.querySelectorAll(".pp-auth input")];
  setValue(ins[0], "Dana Okonkwo");
  setValue(ins[1], "dana@meridian-9.pp");
  setValue(ins[2], "portalpantry");
  document.querySelector(".pp-auth form").requestSubmit();
  await new Promise(r => setTimeout(r, 900));
  return "registered";
})()`;

const fillCart = `(async () => {
  ${prelude}
  await waitFor(".pp-card");
  document.querySelectorAll(".pp-card")[0].click();
  await waitFor(".pp-item .pp-btn");
  const adds = [...document.querySelectorAll(".pp-item .pp-btn")];
  adds[0].click();
  await new Promise(r => setTimeout(r, 150));
  if (adds[1]) adds[1].click();
  await new Promise(r => setTimeout(r, 150));
  [...document.querySelectorAll(".pp-sheet button")].find(b => /Back to the board/.test(b.textContent)).click();
  await new Promise(r => setTimeout(r, 500));
  return "cart filled";
})()`;

const SHOTS = [
  {
    name: "storefront",
    caption: "The board — kitchens, filters, and the shipping manifest rail",
    width: 1440,
    height: 940,
    setup: [registerCustomer, fillCart],
    settle: 900,
  },
  {
    name: "menu",
    caption: "A kitchen menu, arrived through the portal",
    width: 1440,
    height: 940,
    setup: [
      `(async () => {
        ${prelude}
        await waitFor(".pp-card");
        document.querySelectorAll(".pp-card")[1].click();
        await waitFor(".pp-item");
        return "menu open";
      })()`,
    ],
    settle: 1000,
  },
  {
    name: "checkout",
    caption: "Order confirmed — the payoff screen",
    width: 1440,
    height: 940,
    setup: [
      `(async () => {
        ${prelude}
        await waitFor(".pp-board__rail .pp-btn--go");
        document.querySelector(".pp-board__rail .pp-btn--go").click();
        await waitFor(".pp-transit__actions", 12000);
        return "confirmed";
      })()`,
    ],
    settle: 900,
  },
  {
    name: "record",
    caption: "Shipment record — every portal opened on the account",
    width: 1440,
    height: 940,
    setup: [
      `(async () => {
        ${prelude}
        const t = [...document.querySelectorAll(".pp-transit button")].find(b => /Track this shipment/.test(b.textContent));
        if (t) t.click();
        await waitFor(".pp-record");
        return "record open";
      })()`,
    ],
    settle: 700,
  },
  {
    name: "signin",
    caption: "Account dialog",
    width: 1440,
    height: 940,
    reload: true,
    setup: [
      `(async () => {
        ${prelude}
        const out = [...document.querySelectorAll("button")].find(b => /sign out/i.test(b.getAttribute("aria-label") || ""));
        if (out) out.click();
        await new Promise(r => setTimeout(r, 400));
        const btn = [...document.querySelectorAll(".pp-topbar button")].find(b => /Sign in/.test(b.textContent));
        btn.click();
        await waitFor(".pp-auth");
        return "auth open";
      })()`,
    ],
    settle: 700,
  },
  {
    name: "desk-queue",
    caption: "Kitchen desk — the order queue",
    width: 1440,
    height: 940,
    reload: true,
    setup: [signIn("owner@neutrino.pp", "portalpantry")],
    settle: 1000,
  },
  {
    name: "desk-payout",
    caption: "Kitchen desk — payout breakdown, computed server-side",
    width: 1440,
    height: 940,
    setup: [
      `(async () => {
        ${prelude}
        await waitFor("#pp-tab-payout");
        document.querySelector("#pp-tab-payout").click();
        await waitFor(".pp-stat--net");
        return "payout";
      })()`,
    ],
    settle: 700,
  },
  {
    name: "desk-dishes",
    caption: "Kitchen desk — menu and storefront editing",
    width: 1440,
    height: 940,
    setup: [
      `(async () => {
        ${prelude}
        document.querySelector("#pp-tab-dishes").click();
        await waitFor(".pp-dish");
        return "dishes";
      })()`,
    ],
    settle: 700,
  },
  {
    name: "mobile",
    caption: "The board at 390px",
    width: 390,
    height: 844,
    reload: true,
    setup: [
      `(async () => {
        ${prelude}
        const out = [...document.querySelectorAll("button")].find(b => /sign out/i.test(b.getAttribute("aria-label") || ""));
        if (out) out.click();
        await waitFor(".pp-card");
        return "mobile board";
      })()`,
    ],
    settle: 900,
  },
];

/* ---- Minimal CDP client -------------------------------------------------- */

function findChrome() {
  const hit = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!hit) throw new Error("Could not find Chrome. Set PP_CHROME.");
  return process.env.PP_CHROME ?? hit;
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => reject(new Error(method + " timed out")), 30000);
    });
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  // Fail early with a useful message rather than photographing an error page.
  try {
    const res = await fetch(BASE);
    if (!res.ok) throw new Error(String(res.status));
  } catch {
    console.error(`Dev server not reachable at ${BASE}\nStart it with: npm run dev`);
    process.exit(1);
  }

  const profile = join(tmpdir(), `pp-shots-${Date.now()}`);
  const chrome = spawn(
    findChrome(),
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    await sleep(250);
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      wsUrl = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null;
    } catch {
      /* chrome not up yet */
    }
  }
  if (!wsUrl) {
    chrome.kill();
    throw new Error("Chrome did not expose a debugging target.");
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  const cdp = new CDP(ws);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  let navigated = false;
  for (const shot of SHOTS) {
    process.stdout.write(`  ${shot.name} … `);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: shot.width,
      height: shot.height,
      deviceScaleFactor: 1,
      mobile: shot.width < 600,
    });

    if (!navigated || shot.reload) {
      await cdp.send("Page.navigate", { url: BASE });
      await sleep(1400);
      navigated = true;
    }

    for (const js of shot.setup ?? []) {
      const out = await cdp.send("Runtime.evaluate", {
        expression: js,
        awaitPromise: true,
        returnByValue: true,
      });
      if (out.exceptionDetails) {
        throw new Error(`${shot.name}: ${out.exceptionDetails.text} ${out.result?.description ?? ""}`);
      }
    }

    await sleep(shot.settle ?? 600);
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const file = join(OUT, `${shot.name}.png`);
    writeFileSync(file, Buffer.from(data, "base64"));
    console.log(`${(Buffer.from(data, "base64").length / 1024) | 0} kB`);
  }

  ws.close();
  chrome.kill();
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* windows sometimes holds the profile briefly; harmless */
  }
  console.log(`\nWrote ${SHOTS.length} screenshots to ${OUT}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
