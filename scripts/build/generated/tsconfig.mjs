import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const stateDir = await resolveStateDir();
const importsDir = path.join(stateDir, "imports");
const generatedPath = path.join(stateDir, "generated", "tsconfig.paths.json");

async function resolveStateDir() {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const organization = packageJson?.config?.organization?.name;
  if (typeof organization !== "string" || !organization) {
    throw new Error("package metadata is missing config.organization.name");
  }
  return path.join(repoRoot, `.${organization}`, "code-discipline");
}

function normalizeDotTarget(value) {
  const normalized = value.replaceAll(path.sep, path.posix.sep).replace(/^\.\/+/u, "").replace(/\/+/gu, "/");
  if (normalized.startsWith("../")) return normalized;
  return normalized.startsWith("./") ? normalized : `./${normalized.replace(/^\/+/u, "")}`;
}

function toGeneratedTarget(targetPath) {
  const absoluteTarget = path.resolve(repoRoot, targetPath);
  const relative = path.relative(path.dirname(generatedPath), absoluteTarget).replaceAll(path.sep, path.posix.sep);
  if (relative.startsWith("../")) return relative;
  return relative.startsWith("./") ? relative : `./${relative}`;
}

async function readAliasPaths() {
  const entries = await fs.readdir(importsDir, { withFileTypes: true });
  const aliases = {};
  const aliasEntries = entries
  .filter((item) => item.isFile() && item.name.endsWith(".json"))
  .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of aliasEntries) {
    const parsed = JSON.parse(await fs.readFile(path.join(importsDir, entry.name), "utf8"));
    for (const [alias, target] of Object.entries(parsed)) {
      if (typeof target === "string" && !(alias in aliases)) aliases[alias] = normalizeDotTarget(target);
    }
  }
  return aliases;
}

const aliasPaths = await readAliasPaths();
const paths = {};

for (const alias of Object.keys(aliasPaths).sort((left, right) => left.localeCompare(right))) {
  paths[alias] = [toGeneratedTarget(aliasPaths[alias])];
}

await fs.mkdir(path.dirname(generatedPath), { recursive: true });
await fs.writeFile(generatedPath, `${JSON.stringify({ compilerOptions: { paths } }, null, 2)}\n`, "utf8");
