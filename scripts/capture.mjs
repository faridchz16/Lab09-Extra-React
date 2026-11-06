// Takes a screenshot of the running app and saves its console messages.
// Usage: node scripts/capture.mjs <output.png> [--url=http://localhost:5173] [--selector=CSS]
//                                [--viewport] [--wait=ms]
//   Default: full page at 1440x900. --selector captures only that element;
//   --viewport captures only the visible 1440x900 area.
//   The console log goes next to the image, with the same name and .txt extension.
import fs from "node:fs";
import path from "node:path";
import { launchChromium, loadPlaywright } from "./playwright-loader.mjs";

const args = process.argv.slice(2);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const out = args.find((a) => !a.startsWith("--"));
if (!out) {
  console.error("Usage: node scripts/capture.mjs <output.png> [--url=] [--selector=] [--viewport] [--wait=ms]");
  process.exit(1);
}
const url = option("url") ?? "http://localhost:5173";
const selector = option("selector");
const wait = Number(option("wait") ?? 500);

const playwright = await loadPlaywright(import.meta.url);
const browser = await launchChromium(playwright);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const logs = [];
const stamp = () => new Date().toISOString();
page.on("console", (msg) => logs.push(`[${stamp()}] [console.${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[${stamp()}] [pageerror] ${err.stack ?? err.message}`));

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(wait);

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
if (selector) {
  await page.locator(selector).first().screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: !args.includes("--viewport") });
}

const xss = await page.evaluate(() => window.__xss);
logs.push(`[${stamp()}] [capture] window.__xss = ${xss === undefined ? "undefined" : JSON.stringify(xss)}`);

const logFile = out.replace(/\.png$/i, "") + ".txt";
const header = `Console of ${url} (${selector ? `selector ${selector}` : "page"}, 1440x900)\n`;
fs.writeFileSync(logFile, header + (logs.length ? logs.join("\n") : "(no console messages)") + "\n");
await browser.close();
console.log(`Saved ${out} and ${logFile} (${logs.length} console lines)`);
