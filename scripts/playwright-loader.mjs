// Loads Playwright without adding it to package.json.
// The scripts re-run themselves through `npx -p playwright@<version> node <script>`;
// npx puts its temporary node_modules/.bin on PATH, and we resolve "playwright" from there.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const PLAYWRIGHT_VERSION = "1.64.1";

function findInPath() {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    if (!/node_modules[\\/]\.bin[\\/]?$/.test(dir)) continue;
    const modules = path.dirname(dir);
    if (fs.existsSync(path.join(modules, "playwright", "package.json"))) {
      return createRequire(path.join(modules, "noop.js"))("playwright");
    }
  }
  return null;
}

// Returns the playwright module, or re-runs the calling script under npx and exits.
export async function loadPlaywright(scriptUrl) {
  try {
    return await import("playwright");
  } catch {
    const found = findInPath();
    if (found) return found;
  }
  if (process.env.__PW_RELAUNCHED) {
    console.error("Playwright could not be loaded even through npx.");
    process.exit(1);
  }
  const script = new URL(scriptUrl).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const result = spawnSync(
    "npx",
    ["-y", "-p", `playwright@${PLAYWRIGHT_VERSION}`, "node", script, ...process.argv.slice(2)],
    { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, __PW_RELAUNCHED: "1" } },
  );
  process.exit(result.status ?? 1);
}

// Launches Chromium; if the browser is missing, installs it once with npx and retries.
export async function launchChromium(playwright) {
  try {
    return await playwright.chromium.launch();
  } catch (error) {
    if (!/Executable doesn't exist|playwright install/i.test(String(error))) throw error;
    spawnSync("npx", ["-y", `playwright@${PLAYWRIGHT_VERSION}`, "install", "chromium"], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    return playwright.chromium.launch();
  }
}
