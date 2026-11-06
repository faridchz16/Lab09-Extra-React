// Renders a test-output .txt as a PNG that looks like a dark terminal.
// The text is shown exactly as it is in the file (ANSI color codes, if any, are only used to
// pick colors and are not shown); lines are colored by what they contain.
// Usage: node scripts/terminal.mjs <input.txt> [output.png]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { launchChromium, loadPlaywright } from "./playwright-loader.mjs";

const [input, outArg] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node scripts/terminal.mjs <input.txt> [output.png]");
  process.exit(1);
}
const out = outArg ?? input.replace(/\.txt$/i, "") + ".png";
const raw = fs.readFileSync(input, "utf8").replace(/\r\n/g, "\n").replace(/\x1b\[[0-9;]*m/g, "");

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const classOf = (line) => {
  if (/^\s*(✓|√)|\bpassed\b/.test(line) && !/failed/.test(line)) return "ok";
  if (/^\s*(×|FAIL\b)|\bfailed\b|^(Error|AssertionError|TypeError)\b/.test(line)) return "bad";
  if (/^\s*(❯|→)/.test(line)) return "warn";
  if (/^\s*>/.test(line)) return "dim";
  return "";
};
const body = raw
  .split("\n")
  .map((line) => `<span class="${classOf(line)}">${escape(line) || " "}</span>`)
  .join("\n");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; background: #0b0f14; }
  .win { margin: 24px; border-radius: 10px; overflow: hidden; background: #11161d;
         box-shadow: 0 10px 30px rgba(0,0,0,.5); border: 1px solid #222a35; display: inline-block; min-width: 1100px; }
  .bar { background: #1b222c; padding: 10px 14px; display: flex; gap: 8px; align-items: center;
         font: 13px "Segoe UI", sans-serif; color: #8b98a8; }
  .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  pre { margin: 0; padding: 16px 20px; color: #d6dde6; font: 14px/1.45 Consolas, "Cascadia Mono", monospace;
        white-space: pre; }
  .ok { color: #4ade80; } .bad { color: #f87171; } .warn { color: #fbbf24; } .dim { color: #7d8896; }
</style></head><body><div class="win"><div class="bar">
  <span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span>
  <span class="dot" style="background:#28c840"></span><span style="margin-left:10px">${escape(path.basename(input))}</span>
</div><pre>${body}</pre></div></body></html>`;

const playwright = await loadPlaywright(import.meta.url);
const browser = await launchChromium(playwright);
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const tmp = path.resolve(out.replace(/\.png$/i, "") + ".__terminal.html");
fs.writeFileSync(tmp, html);
try {
  await page.goto(pathToFileURL(tmp).href);
  await page.locator(".win").screenshot({ path: out });
} finally {
  fs.rmSync(tmp, { force: true });
  await browser.close();
}
console.log(`Saved ${out}`);
