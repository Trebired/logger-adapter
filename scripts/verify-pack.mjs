import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = path.join(rootDir, ".tmp", "verify-pack");
const packageJsonBackupPath = path.join(rootDir, ".tmp", "package.json.backup");
const nodeTypesDir = path.join(rootDir, "node_modules", "@types", "node");
const tscBin = path.join(rootDir, "node_modules", "typescript", "bin", "tsc");

async function main() {
  await resetTempRoot();

  const tarballPath = packPackage();
  const tarballEntries = listTarEntries(tarballPath);
  const packedPackageJson = readPackedPackageJson(tarballPath);

  validatePackedEntrypoints(packedPackageJson, tarballEntries);
  validatePackedImports(packedPackageJson, tarballEntries);
  await runConsumerSmokeTest(tarballPath);

  console.log("Pack verification succeeded.");
}

async function resetTempRoot() {
  await fs.rm(tempRoot, { force: true, recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });
}

function packPackage() {
  try {
    const stdout = execFileSync("bun", ["pm", "pack", "--quiet", "--destination", tempRoot], {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
    return resolvePackedTarballPath(stdout);
  }
  catch (error) {
    restorePackageJsonFromBackup();
    throw error;
  }
}

function listTarEntries(tarballPath) {
  const stdout = execFileSync("tar", ["-tf", tarballPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  return new Set(stdout.split("\n").map((entry) => entry.trim()).filter(Boolean));
}

function readPackedPackageJson(tarballPath) {
  const stdout = execFileSync("tar", ["-xOf", tarballPath, "package/package.json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

  return JSON.parse(stdout);
}

function validatePackedEntrypoints(packageJson, tarballEntries) {
  const targets = collectEntrypointTargets(packageJson);

  for (const target of targets) {
    assertTarEntryExists(tarballEntries, target, `Missing packed entrypoint target: ${target}`);
  }
}

function collectEntrypointTargets(packageJson) {
  const targets = new Set();

  addTarget(targets, packageJson.main);
  addTarget(targets, packageJson.types);

  for (const value of Object.values(packageJson.exports || {})) {
    collectExportTargets(value, targets);
  }

  return targets;
}

function collectExportTargets(value, targets) {
  if (!value) return;

  if (typeof value === "string") {
    addTarget(targets, value);
    return;
  }

  for (const nested of Object.values(value)) {
    collectExportTargets(nested, targets);
  }
}

function addTarget(targets, value) {
  if (typeof value !== "string" || value.length === 0) return;
  targets.add(value);
}

function validatePackedImports(packageJson, tarballEntries) {
  for (const [alias, target] of Object.entries(packageJson.imports || {})) {
    if (typeof target !== "string") continue;

    if (target.includes("./src/") || target.includes("./internal/")) {
      throw new Error(`Packed imports entry ${alias} still points at source path ${target}.`);
    }

    assertTarEntryExists(tarballEntries, target, `Packed imports target is missing for ${alias}: ${target}`);
  }
}

function assertTarEntryExists(tarballEntries, packagePath, message) {
  const normalized = normalizePackagePath(packagePath);

  if (!tarballEntries.has(normalized)) {
    throw new Error(message);
  }
}

function normalizePackagePath(packagePath) {
  return `package/${String(packagePath).replace(/^\.\//u, "")}`;
}

function resolvePackedTarballPath(stdout) {
  const printed = String(stdout || "").trim().split(/\r?\n/u).pop() || "";
  const candidates = [
    path.resolve(rootDir, printed),
    path.resolve(tempRoot, printed),
  ];
  const resolved = candidates.find((candidate) => existsSync(candidate)) ?? findPackedTarball();
  if (!resolved) throw new Error("bun pm pack did not return a tarball filename.");
  return resolved;
}

function findPackedTarball() {
  return readdirSync(tempRoot)
    .filter((entry) => entry.endsWith(".tgz"))
    .map((entry) => path.join(tempRoot, entry))
    .sort()
    .at(0);
}

async function runConsumerSmokeTest(tarballPath) {
  const consumerDir = path.join(tempRoot, "consumer");

  await fs.mkdir(consumerDir, { recursive: true });
  await writeConsumerManifest(consumerDir, tarballPath);
  await writeConsumerBrowserFixture(consumerDir);
  await writeConsumerTypecheckFixture(consumerDir);
  await writeConsumerRuntimeFixture(consumerDir);
  await writeConsumerTsconfig(consumerDir);
  runConsumerChecks(consumerDir);
}

async function writeConsumerManifest(consumerDir, tarballPath) {
  await fs.writeFile(path.join(consumerDir, "package.json"), JSON.stringify({
    name: "logger-adapter-pack-smoke",
    private: true,
    type: "module",
    dependencies: {
      "@package/logger-adapter": `file:${tarballPath}`,
    },
    devDependencies: {
      "@types/node": `file:${nodeTypesDir}`,
    },
  }, null, 2));
}

async function writeConsumerTypecheckFixture(consumerDir) {
  await fs.writeFile(path.join(consumerDir, "index.ts"), [
    'import { logPackageInitialized, resolveLogger } from "@package/logger-adapter";',
    'import { resolveLogger as resolveBrowserLogger } from "@package/logger-adapter/browser";',
    "",
    "const events: unknown[] = [];",
    'const logger = resolveLogger({ source: "pack.smoke", adapter: (_source, event) => { events.push(event); } });',
    'logger?.info("pack.smoke", "ready");',
    'logPackageInitialized({ source: "pack.smoke", adapter: (_source, event) => { events.push(event); } });',
    'const browserLogger = resolveBrowserLogger({ source: "pack.browser", fallback: "noop" });',
    'browserLogger.info("pack.browser", "ready");',
    "",
    "console.log(events.length);",
  ].join("\n"));
}

async function writeConsumerBrowserFixture(consumerDir) {
  await fs.writeFile(path.join(consumerDir, "browser-entry.mjs"), [
    'import { logPackageInitialized, resolveLogger } from "@package/logger-adapter";',
    "",
    "const events = [];",
    "globalThis.__tb_logger__ = (source) => ({",
    "  info(group, message, metadata) { events.push({ group, message, metadata, source }); },",
    "  warn(group, message, metadata) { events.push({ group, message, metadata, source }); },",
    "  error(group, message, metadata) { events.push({ group, message, metadata, source }); },",
    "  fail(group, message, metadata) { events.push({ group, message, metadata, source }); },",
    "});",
    'const logger = resolveLogger({ source: "pack.browser" });',
    'logger.info("pack.browser", "ready");',
    'logPackageInitialized({ source: "pack.browser" });',
    "globalThis.__pack_browser_events__ = events;",
    "",
  ].join("\n"));
}

async function writeConsumerRuntimeFixture(consumerDir) {
  await fs.writeFile(path.join(consumerDir, "runtime.mjs"), [
    'import { logPackageInitialized, resolveLogger } from "@package/logger-adapter";',
    'import { resolveLogger as resolveBrowserLogger } from "@package/logger-adapter/browser";',
    "",
    "const events = [];",
    'const logger = resolveLogger({ source: "pack.runtime", adapter: (_source, event) => { events.push(event); } });',
    'logger?.info("pack.runtime", "ready");',
    'logPackageInitialized({ source: "pack.runtime", adapter: (_source, event) => { events.push(event); } });',
    'const browserLogger = resolveBrowserLogger({ source: "pack.browser", fallback: "noop" });',
    'browserLogger.info("pack.browser", "ready");',
    "",
    "console.log(events.length);",
  ].join("\n"));
}

async function writeConsumerTsconfig(consumerDir) {
  await fs.writeFile(path.join(consumerDir, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      lib: ["ES2020"],
      module: "ESNext",
      moduleResolution: "Bundler",
      noEmit: true,
      target: "ES2020",
      types: ["node"],
    },
    include: ["./index.ts"],
  }, null, 2));
}

function runConsumerChecks(consumerDir) {
  execFileSync("bun", ["install", "--ignore-scripts"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  execFileSync("bun", [tscBin, "-p", "tsconfig.json"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  execFileSync("bun", ["runtime.mjs"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  execFileSync("bun", ["build", "browser-entry.mjs", "--target=browser", "--outfile=browser-output.js"], {
    cwd: consumerDir,
    stdio: "inherit",
  });

  const browserOutput = execFileSync("cat", [path.join(consumerDir, "browser-output.js")], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  if (browserOutput.includes("node:module") || browserOutput.includes("createRequire")) {
    throw new Error("Browser bundle contains Node-only default logger resolution.");
  }
}

function restorePackageJsonFromBackup() {
  if (!existsSync(packageJsonBackupPath)) return;
  writeFileSync(path.join(rootDir, "package.json"), readFileSync(packageJsonBackupPath, "utf8"));
  unlinkSync(packageJsonBackupPath);
}

await main();
