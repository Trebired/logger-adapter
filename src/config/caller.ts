import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCachedConfigSync } from "@package/logger/config";

function filePathFromStackLine(line: string): string {
  const fileUrlMatch = line.match(/file:\/\/[^:)]+/u);
  if (fileUrlMatch) return fileURLToPath(fileUrlMatch[0]);

  const absolutePathMatch = line.match(/(?:\(|\s)(\/[^:)]+)(?::\d+)?(?::\d+)?\)?$/u);
  return absolutePathMatch ? absolutePathMatch[1] : "";
}

function findPackageRoot(startPath: string): string {
  let current = fs.existsSync(startPath) && fs.statSync(startPath).isDirectory()
  ? startPath
  : path.dirname(startPath);

  for (;; ) {
    if (fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return "";
    current = parent;
  }
}

const ADAPTER_PACKAGE_ROOT = findPackageRoot(fileURLToPath(import.meta.url));
const LOGGER_PACKAGE_ROOT = resolveLoggerPackageRoot();

function resolveLoggerPackageRoot(): string {
  if (!ADAPTER_PACKAGE_ROOT) return "";
  const candidate = path.join(path.dirname(ADAPTER_PACKAGE_ROOT), "logger");
  return fs.existsSync(path.join(candidate, "package.json")) ? candidate : "";
}

function isWithin(filePath: string, root: string): boolean {
  return Boolean(root && (filePath === root || filePath.startsWith(`${root}${path.sep}`)));
}

function isAdapterInternalFile(filePath: string): boolean {
  return isWithin(filePath, ADAPTER_PACKAGE_ROOT) || isWithin(filePath, LOGGER_PACKAGE_ROOT);
}

function resolveCallerConfigStart(): string {
  const stack = new Error().stack || "";
  for (const line of stack.split("\n")) {
    const filePath = filePathFromStackLine(line);
    if (!filePath || isAdapterInternalFile(filePath)) continue;

    return findPackageRoot(filePath) || path.dirname(filePath);
  }

  return process.cwd();
}

function resolveCallerLoggerPrefix(): false | string {
  try {
    return loadCachedConfigSync(resolveCallerConfigStart()).prefix;
  } catch {
    return false;
  }
}

function resolveCallerPackageRoot(isSkipped: (packageRoot: string) => boolean): string {
  const stack = new Error().stack || "";
  for (const line of stack.split("\n")) {
    const filePath = filePathFromStackLine(line);
    if (!filePath || isAdapterInternalFile(filePath)) continue;
    const packageRoot = findPackageRoot(filePath) || path.dirname(filePath);
    if (isSkipped(packageRoot)) continue;
    return packageRoot;
  }

  return process.cwd();
}

export { resolveCallerLoggerPrefix, resolveCallerPackageRoot };
