import type { LoggerAdapterDefaultLogger, LoggerAdapterLogger } from "#903rjwb52opy";

type BrowserLoggerGlobal = typeof globalThis & {
  __tb_logger__?: LoggerAdapterDefaultLogger;
  tbLogger?: LoggerAdapterDefaultLogger;
};

function resolveBrowserGlobalLogger(): LoggerAdapterDefaultLogger | undefined {
  const global = globalThis as BrowserLoggerGlobal;
  return global.__tb_logger__ ?? global.tbLogger;
}

function resolveConfiguredBrowserDefaultLogger(
  defaultLogger: LoggerAdapterDefaultLogger | false | undefined,
  source: string,
): LoggerAdapterLogger | null {
  const candidate = defaultLogger === undefined ? resolveBrowserGlobalLogger() : defaultLogger;
  if (candidate === false) return null;
  if (typeof candidate === "function") {
    try {
      return candidate(source) ?? null;
    } catch {
      return null;
    }
  }
  return candidate ?? null;
}

export { resolveConfiguredBrowserDefaultLogger, resolveBrowserGlobalLogger };
