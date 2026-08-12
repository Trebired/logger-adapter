import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const crateDir = path.join(rootDir, "rust", "logger-adapter");
const lockfilePath = path.join(crateDir, "Cargo.lock");
const manifestPath = path.join(crateDir, "Cargo.toml");
const targetDir = path.join(rootDir, ".tmp", "rust-target");

async function main() {
  try {
    execFileSync("cargo", ["test", "--manifest-path", manifestPath, "--target-dir", targetDir], {
        cwd: rootDir,
        stdio: "inherit",
    });
  }
  finally {
    await fs.rm(lockfilePath, { force: true });
  }
}

await main();
