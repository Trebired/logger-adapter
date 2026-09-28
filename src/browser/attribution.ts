import { callEventSink, callLevelMethod } from "#g37d0m22fyfl";
import { buildLogEvent } from "#h7r5guzmkuvo";
import { fallbackLevel, fallbackLogger } from "#op66hzcikawq";
import type { LoggerAdapterResolveOptions } from "#903rjwb52opy";
import { applyGroupPrefix, sourcePackagePrefix } from "#br5q34hru3ot";
import { resolveConfiguredBrowserDefaultLogger } from "./default-logger.js";
import { shouldLogPackageInitialized } from "#anwxg5mi2ml0";

type LoggerAdapterAttributionOptions = LoggerAdapterResolveOptions& {
  group?: string;
  message: string;
  metadata?: unknown;
};

const ATTRIBUTION_SCOPE = "attribution";

function buildAttributionGroup(options: LoggerAdapterAttributionOptions): string {
  const prefix = options.groupPrefix ?? sourcePackagePrefix(options.source);
  return applyGroupPrefix(options.group || ATTRIBUTION_SCOPE, prefix);
}

function logPackageAttribution(options: LoggerAdapterAttributionOptions): void {
  const source = options.adapter
  ? options.logger
  : options.logger ?? resolveConfiguredBrowserDefaultLogger(options.defaultLogger, options.source);
  if (!shouldLogPackageInitialized(options, source, ATTRIBUTION_SCOPE)) return;

  const group = buildAttributionGroup(options);
  const event = buildLogEvent("info", group, options.message, options.metadata);

  if (typeof options.adapter === "function") {
    options.adapter(source, event);
    return;
  }

  if (callLevelMethod(source, "info", event)) return;
  if (callEventSink(source, event)) return;

  const fallback = fallbackLogger(options.fallback ?? "console", fallbackLevel("info"));
  fallback(group, options.message, options.metadata);
}

export { logPackageAttribution };
export type { LoggerAdapterAttributionOptions };
