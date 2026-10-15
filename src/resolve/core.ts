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

type GroupPrefixResolver = (options: LoggerAdapterResolveOptions) => false | string;

type ClaimGuard = (claim: { group: string; source?: string }) => void;

type ClaimGuardFactory = () => ClaimGuard;

function noClaimGuard(): ClaimGuard {
  return () => undefined;
}

function resolveGroupPrefix(
  options: LoggerAdapterResolveOptions,
  resolveConfiguredGroupPrefix: GroupPrefixResolver,
): false | string {
  if (Object.prototype.hasOwnProperty.call(options, "groupPrefix")) {
    return options.groupPrefix === false
    ? false
    : applyGroupPrefix("", options.groupPrefix);
  }

  return resolveConfiguredGroupPrefix(options);
}

function createLoggerResolver(
  resolveDefaultLogger: DefaultLoggerResolver,
  resolveConfiguredGroupPrefix: GroupPrefixResolver = () => false,
  createClaimGuard: ClaimGuardFactory = noClaimGuard,
) {
  function resolveLogMethod(
    options: LoggerAdapterResolveOptions,
    level: LoggerAdapterLevel,
    fallback: LoggerAdapterLogMethod,
    groupPrefix: false | string,
    guard: ClaimGuard,
  ): LoggerAdapterLogMethod {
    const source = options.adapter
    ? options.logger
    : options.logger ?? resolveDefaultLogger(options.defaultLogger, options.source);

    return (group: string, message: string, metadata?: unknown) => {
      const resolvedGroup = applyGroupPrefix(group, groupPrefix);
      guard({ group: resolvedGroup, source: options.source });
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
    const groupPrefix = resolveGroupPrefix(options, resolveConfiguredGroupPrefix);
    const guard = createClaimGuard();

    if (typeof groupPrefix === "string") guard({ group: groupPrefix, source: options.source });

    return {
      info: resolveLogMethod(options, "info", fallbackLogger(fallbackMode, "info"), groupPrefix, guard),
      warn: resolveLogMethod(options, "warn", fallbackLogger(fallbackMode, "warn"), groupPrefix, guard),
      error: resolveLogMethod(options, "error", fallbackLogger(fallbackMode, "error"), groupPrefix, guard),
      fail: resolveLogMethod(options, "fail", fallbackLogger(fallbackMode, "error"), groupPrefix, guard),
      log(level, group, message, metadata) {
        const fallbackLevel = level === "warn" ? "warn" : level === "error" || level === "fail" ? "error" : "info";
        return resolveLogMethod(options, level, fallbackLogger(fallbackMode, fallbackLevel), groupPrefix, guard)(group, message, metadata);
      },
    };
  };
}

export { createLoggerResolver };
export type { ClaimGuard, ClaimGuardFactory };
