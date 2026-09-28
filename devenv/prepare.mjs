import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const state = resolve(".devenv/state/mantis");
const marker = join(state, "preparation.json");
const browsers = resolve(".devenv/playwright-browsers");
process.env.PLAYWRIGHT_BROWSERS_PATH = browsers;
const ignore = new Set([".git", ".devenv", ".direnv", "node_modules", "dist", "test-results", "playwright-report", "coverage", ".env", "data", "recordings", "transcripts", ".firecrawl"]);
const inputs = ["package.json", "package-lock.json", "devenv.nix", "devenv.yaml", "devenv.lock", "vite.config.ts", "playwright.config.ts", "tsconfig.json", "index.html", "src", "public", "config", "tests", "scripts", "devenv/prepare.mjs"];
function digest(paths) {
  const hash = createHash("sha256");
  function visit(path) {
    if (!existsSync(path)) { hash.update(`missing:${path}\0`); return; }
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) { hash.update(`link:${relative(root, path)}:${readlinkSync(path)}\0`); return; }
    if (stat.isDirectory()) {
      hash.update(`dir:${relative(root, path)}\0`);
      for (const entry of readdirSync(path).sort().filter((entry) => !ignore.has(entry) && !entry.startsWith(".env"))) visit(join(path, entry));
    } else if (stat.isFile()) {
      hash.update(`file:${relative(root, path)}\0`);
      hash.update(readFileSync(path));
    } else throw new Error(`Unexpected artifact type: ${path}`);
  }
  for (const path of paths) visit(resolve(path));
  return hash.digest("hex");
}
function run(cmd, args, env = {}) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${cmd} ${args.join(" ")} exited ${result.status ?? result.signal}`);
}
function match(record, key, paths) { return record?.[key] === digest(paths); }
function complete(output) { return existsSync(join(output, "index.html")) && existsSync(join(output, "assets")) && readdirSync(resolve(output, "assets")).length > 0; }

mkdirSync(state, { recursive: true });
const previous = existsSync(marker) ? JSON.parse(readFileSync(marker, "utf8")) : null;
rmSync(marker, { force: true });
const runtime = `${process.version}:${process.versions.modules}:${process.platform}:${process.arch}:${process.execPath}`;
const dependencies = digest(["package.json", "package-lock.json", "devenv.nix", "devenv.lock"]);
const source = digest(inputs);
const record = { runtime, dependencies, source };
const modules = ["node_modules/better-sqlite3", "node_modules/vite", "node_modules/tsx", "node_modules/@playwright/test"];
if (previous?.runtime !== runtime || previous?.dependencies !== dependencies || !match(previous, "modules", modules)) {
  console.log("Preparing lockfile-matched dependencies for shell Node ABI");
  run("npm", ["ci", "--include=dev", "--prefer-offline"], { NODE_ENV: "development" });
}
run("node", ["-e", "require('better-sqlite3')(':memory:').close()"]);
record.modules = digest(modules);
const { chromium } = await import("@playwright/test");
const browser = chromium.executablePath();
if (!existsSync(browser) || previous?.runtime !== runtime || previous?.dependencies !== dependencies || !match(previous, "browser", [browser])) {
  console.log("Provisioning project Playwright Chromium");
  run("node", ["node_modules/@playwright/test/cli.js", "install", "chromium"]);
}
record.browser = digest([browser]);
if (previous?.source !== source || previous?.dependencies !== dependencies || previous?.runtime !== runtime || !complete("dist/client") || !match(previous, "client", ["dist/client"])) {
  console.log("Building production client (VITE_E2E=false)");
  rmSync("dist/client", { recursive: true, force: true });
  run("npm", ["run", "build"], { NODE_ENV: "production", VITE_E2E: "false" });
}
record.client = digest(["dist/client"]);
if (previous?.source !== source || previous?.dependencies !== dependencies || previous?.runtime !== runtime || !complete("dist/e2e-client") || !match(previous, "e2e", ["dist/e2e-client"])) {
  console.log("Building isolated fake-provider client (VITE_E2E=true)");
  rmSync("dist/e2e-client", { recursive: true, force: true });
  run("node", ["node_modules/vite/bin/vite.js", "build", "--outDir", "dist/e2e-client"], { NODE_ENV: "production", VITE_E2E: "true" });
}
record.e2e = digest(["dist/e2e-client"]);
if (!["dist/client", "dist/e2e-client"].every(complete)) throw new Error("Incomplete client output");
const launched = spawnSync(process.execPath, ["--input-type=module", "-e", "import { chromium } from '@playwright/test'; const b=await chromium.launch({headless:true}); await b.close()"], { cwd: root, env: process.env, encoding: "utf8" });
if (launched.status !== 0) throw new Error(`Project Chromium launch failed: ${launched.stderr || launched.error || launched.signal}`);
writeFileSync(`${marker}.tmp`, JSON.stringify(record) + "\n");
renameSync(`${marker}.tmp`, marker);
console.log(`Mantis shell ready: Node ${runtime}, source ${source}, dependencies ${dependencies}; production and fake clients verified`);
