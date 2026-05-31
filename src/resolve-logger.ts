import { callEventSink, callLevelMethod } from "./emit.js";
import { buildLogEvent } from "./event.js";
import { fallbackLogger } from "./fallback.js";
import { tryResolveDefaultLogger } from "./default-logger.js";
import type {
  LoggerAdapterLevel,
  LoggerAdapterLogMethod,
  LoggerAdapterResolveOptions,
  NormalizedLoggerAdapter,
} from "./types.js";

function resolveLogMethod(
  options: LoggerAdapterResolveOptions,
  level: LoggerAdapterLevel,
  fallback: LoggerAdapterLogMethod,
): LoggerAdapterLogMethod {
  const source = options.adapter ? options.logger : options.logger ?? tryResolveDefaultLogger(options.source);

  return (group: string, message: string, metadata?: unknown) => {
    const event = buildLogEvent(level, group, message, metadata);

    if (typeof options.adapter === "function") {
      options.adapter(source, event);
      return;
    }

    if (callLevelMethod(source, level, event)) return;
    if (callEventSink(source, event)) return;
    fallback(group, message, metadata);
  };
}

function resolveLogger(options: LoggerAdapterResolveOptions): NormalizedLoggerAdapter {
  const fallbackMode = options.fallback ?? "console";

  return {
    info: resolveLogMethod(options, "info", fallbackLogger(fallbackMode, "info")),
    warn: resolveLogMethod(options, "warn", fallbackLogger(fallbackMode, "warn")),
    error: resolveLogMethod(options, "error", fallbackLogger(fallbackMode, "error")),
    fail: resolveLogMethod(options, "fail", fallbackLogger(fallbackMode, "error")),
  };
}

export { resolveLogger };
