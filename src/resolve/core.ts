import { callEventSink, callLevelMethod } from "#g37d0m22fyfl";
import { buildLogEvent } from "#h7r5guzmkuvo";
import { fallbackLogger } from "#op66hzcikawq";
import { applyGroupPrefix } from "#br5q34hru3ot";
import type {
  LoggerAdapterDefaultLogger,
  LoggerAdapterLevel,
  LoggerAdapterLogMethod,
  LoggerAdapterLogger,
  LoggerAdapterResolveOptions,
  NormalizedLoggerAdapter,
} from "#903rjwb52opy";

type DefaultLoggerResolver = (
  defaultLogger: LoggerAdapterDefaultLogger | false | undefined,
  source: string,
) => LoggerAdapterLogger | null;

function createLoggerResolver(resolveDefaultLogger: DefaultLoggerResolver) {
  function resolveLogMethod(
    options: LoggerAdapterResolveOptions,
    level: LoggerAdapterLevel,
    fallback: LoggerAdapterLogMethod,
  ): LoggerAdapterLogMethod {
    const source = options.adapter
    ? options.logger
    : options.logger ?? resolveDefaultLogger(options.defaultLogger, options.source);

    return (group: string, message: string, metadata?: unknown) => {
      const resolvedGroup = applyGroupPrefix(group, options.groupPrefix);
      const event = buildLogEvent(level, resolvedGroup, message, metadata);

      if (typeof options.adapter === "function") {
        options.adapter(source, event);
        return;
      }

      if (callLevelMethod(source, level, event)) return;
      if (callEventSink(source, event)) return;
      fallback(resolvedGroup, message, metadata);
    };
  }

  return (options: LoggerAdapterResolveOptions): NormalizedLoggerAdapter => {
    const fallbackMode = options.fallback ?? "console";

    return {
      info: resolveLogMethod(options, "info", fallbackLogger(fallbackMode, "info")),
      warn: resolveLogMethod(options, "warn", fallbackLogger(fallbackMode, "warn")),
      error: resolveLogMethod(options, "error", fallbackLogger(fallbackMode, "error")),
      fail: resolveLogMethod(options, "fail", fallbackLogger(fallbackMode, "error")),
      log(level, group, message, metadata) {
        const fallbackLevel = level === "warn" ? "warn" : level === "error" || level === "fail" ? "error" : "info";
        return resolveLogMethod(options, level, fallbackLogger(fallbackMode, fallbackLevel))(group, message, metadata);
      },
    };
  };
}

export { createLoggerResolver };
