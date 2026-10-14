import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createLog } from "@package/logger";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const log = createLog({ console: true, save: false });
const organization = String.fromCharCode(116, 114, 101, 98, 105, 114, 101, 100);

function adapterUrl() {
  return pathToFileURL(path.join(rootDir, "dist", "index.js")).href;
}

function loggerUrl() {
  return pathToFileURL(path.join(rootDir, "node_modules", "@package", "logger", "dist", "index.js")).href;
}

function throughAdapter(group, assembled) {
  const expression = assembled ? `["${group.slice(0, 3)}", "${group.slice(3)}"].join("")` : JSON.stringify(group);
  return [
    `import { resolveLogger } from ${JSON.stringify(adapterUrl())};`,
    `const adapter = resolveLogger({ fallback: "noop", source: "@example/fixture" });`,
    `adapter.info(${expression}, "a line");`,
    `console.log("reached the end");`,
  ].join("\n");
}

function throughLogger(group) {
  return [
    `import ${JSON.stringify(adapterUrl())};`,
    `import { createLog } from ${JSON.stringify(loggerUrl())};`,
    `const log = createLog({ console: false, prefix: false, save: false, source: "fixture" });`,
    `log.info(${JSON.stringify(group)}, "a line");`,
    `console.log("reached the end");`,
  ].join("\n");
}

async function writeFixture(root, manifest, body) {
  const dir = path.join(root, manifest.name.replace("@", "").replace("/", "-"));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "package.json"), `${JSON.stringify({ type: "module", version: "1.0.0", ...manifest }, null, 2)}\n`);
  const file = path.join(dir, "index.mjs");
  await fs.writeFile(file, body);
  return file;
}

async function runFixture(file) {
  const child = Bun.spawn([process.execPath, file], { stderr: "pipe", stdout: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
  ]);
  return { code, stderr, stdout };
}

async function expectRefusal(root, manifest, body, reason) {
  const result = await runFixture(await writeFixture(root, manifest, body));
  assert.equal(result.code, 1, `${reason}: the process stops`);
  assert.match(result.stderr, /\[FAIL, log\.namespace\]/u, `${reason}: the refusal is reported`);
  assert.match(result.stderr, new RegExp(`${manifest.name} logged under`, "u"), `${reason}: the package is named`);
  assert.doesNotMatch(result.stdout, /reached the end/u, `${reason}: nothing runs after the claim`);
}

async function expectAllowed(root, manifest, body, reason) {
  const result = await runFixture(await writeFixture(root, manifest, body));
  assert.equal(result.code, 0, `${reason}: the process lives :: ${result.stderr}`);
  assert.match(result.stdout, /reached the end/u, `${reason}: the call returns`);
}

const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "adapter-namespace-"));

await expectRefusal(
  workDir,
  { name: "evil-pkg" },
  throughAdapter(`${organization}.cache`, false),
  "a package that is not ours may not claim the namespace",
);
await expectRefusal(
  workDir,
  { name: "sneaky-pkg" },
  throughAdapter(`${organization}.cache`, true),
  "a group assembled at runtime is read like a literal one",
);
await expectRefusal(
  workDir,
  { config: { organization: { displayName: "Trebired", name: organization } }, name: "example-app" },
  throughAdapter(`${organization}.app`, false),
  "an application of the organization is not a package of it",
);
await expectRefusal(
  workDir,
  { name: "direct-pkg" },
  throughLogger(`${organization}.direct`),
  "a package that skips the adapter is still read at the record",
);
await expectAllowed(
  workDir,
  { name: `@${organization}/fixture` },
  throughAdapter(`${organization}.fixture`, false),
  "a package of the organization logs under the namespace",
);
await expectAllowed(
  workDir,
  { name: "other-pkg" },
  throughAdapter("acme.cache", false),
  "a group outside the namespace is nobody's business",
);

await fs.rm(workDir, { force: true, recursive: true });
log.info("verify.namespace", "Log namespace verification succeeded.");
