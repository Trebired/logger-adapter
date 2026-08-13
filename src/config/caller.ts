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

function isAdapterInternalFile(filePath: string): boolean {
  return Boolean(
    ADAPTER_PACKAGE_ROOT &&
      (filePath === ADAPTER_PACKAGE_ROOT ||
        filePath.startsWith(`${ADAPTER_PACKAGE_ROOT}${path.sep}`)),
  );
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

export { resolveCallerLoggerPrefix };
