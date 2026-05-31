import { createRequire } from "node:module";

import type { LoggerAdapterLogger } from "./types.js";

type TrebiredLoggerModule = {
  createLog?: (options?: Record<string, unknown>) => LoggerAdapterLogger;
};

const defaultLoggerCache = new Map<string, LoggerAdapterLogger | null>();

function tryResolveDefaultLogger(source: string): LoggerAdapterLogger | null {
  if (defaultLoggerCache.has(source)) return defaultLoggerCache.get(source) ?? null;

  try {
    const require = createRequire(import.meta.url);
    const mod = require("@trebired/logger") as TrebiredLoggerModule;
    if (typeof mod.createLog === "function") {
      const logger = mod.createLog({
        console: true,
        quiet: true,
        save: false,
        source,
      });
      defaultLoggerCache.set(source, logger);
      return logger;
    }
  } catch {}

  defaultLoggerCache.set(source, null);
  return null;
}

export { tryResolveDefaultLogger };
