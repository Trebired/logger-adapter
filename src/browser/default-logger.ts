import type { LoggerAdapterDefaultLogger, LoggerAdapterLogger } from "#903rjwb52opy";

type BrowserLoggerGlobal = typeof globalThis& {
  __logger_adapter_logger__?: LoggerAdapterDefaultLogger;
  loggerAdapterLogger?: LoggerAdapterDefaultLogger;
};

function resolveBrowserGlobalLogger(): LoggerAdapterDefaultLogger | undefined {
  const global = globalThis as BrowserLoggerGlobal;
  return global.__logger_adapter_logger__ ?? global.loggerAdapterLogger;
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
