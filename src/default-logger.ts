import { createRequire } from "node:module";

import { PACKAGE_NAME } from "./package/metadata.js";
import type { LoggerAdapterDefaultLogger, LoggerAdapterLogger } from "./types.js";

type PackageLoggerModule = {
  createLog?: (options?: Record<string, unknown>) => LoggerAdapterLogger;
};

const defaultLoggerCache = new Map<string, LoggerAdapterLogger|null>();

function siblingPackageName(slug: string): string {
  const scope = new RegExp("^@([^/]+)/").exec(PACKAGE_NAME)?.[1];
  return scope ? `@${scope}/${slug}` : slug;
}

function defaultLoggerPackageCandidates(): string[] {
  return Array.from(new Set(["@package/logger", siblingPackageName("logger")]));
}

function tryResolveDefaultLogger(source: string): LoggerAdapterLogger | null {
  if (defaultLoggerCache.has(source)) return defaultLoggerCache.get(source) ?? null;

  const require = createRequire(import.meta.url);
  for (const packageName of defaultLoggerPackageCandidates()) {
    try {
      const mod = require(packageName) as PackageLoggerModule;
      if (typeof mod.createLog !== "function") continue;
      const logger = mod.createLog({
          console: true,
          quiet: true,
          prefix: false,
          save: false,
          source,
      });
      defaultLoggerCache.set(source, logger);
      return logger;
    } catch {}
  }

  defaultLoggerCache.set(source, null);
  return null;
}

function resolveConfiguredDefaultLogger(
  defaultLogger: LoggerAdapterDefaultLogger | false | undefined,
  source: string,
): LoggerAdapterLogger | null {
  if (defaultLogger === false) return null;
  if (typeof defaultLogger === "function") {
    try {
      return defaultLogger(source) ?? null;
    } catch {
      return null;
    }
  }
  return defaultLogger ?? tryResolveDefaultLogger(source);
}

export { defaultLoggerPackageCandidates, resolveConfiguredDefaultLogger, tryResolveDefaultLogger };
