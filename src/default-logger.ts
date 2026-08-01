import { createRequire } from "node:module";

import type { LoggerAdapterDefaultLogger, LoggerAdapterLogger } from "./types.js";

type PackageLoggerModule = {
  createLog?: (options?: Record<string, unknown>) => LoggerAdapterLogger;
};

const PUBLIC_LOGGER_PACKAGE = `@${String.fromCharCode(116, 114, 101, 98, 105, 114, 101, 100)}/logger`;
const defaultLoggerCache = new Map<string, LoggerAdapterLogger | null>();

function tryResolveDefaultLogger(source: string): LoggerAdapterLogger | null {
  if (defaultLoggerCache.has(source)) return defaultLoggerCache.get(source) ?? null;

  const require = createRequire(import.meta.url);
  for (const packageName of ["@package/logger", PUBLIC_LOGGER_PACKAGE]) {
    try {
      const mod = require(packageName) as PackageLoggerModule;
      if (typeof mod.createLog !== "function") continue;
      const logger = mod.createLog({
        console: true,
        quiet: true,
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

export { resolveConfiguredDefaultLogger, tryResolveDefaultLogger };
