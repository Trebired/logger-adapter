import { callEventSink, callLevelMethod } from "./emit.js";
import { buildLogEvent } from "./event.js";
import { fallbackLevel, fallbackLogger } from "./fallback.js";
import { tryResolveDefaultLogger } from "./default-logger.js";
import type { LoggerAdapterResolveOptions } from "./types.js";

function logPackageInitialized(options: LoggerAdapterResolveOptions): void {
  const source = options.adapter ? options.logger : options.logger ?? tryResolveDefaultLogger(options.source);
  const message = `${options.source} initialized`;
  const event = buildLogEvent("success", "logger.loader", message);

  if (typeof options.adapter === "function") {
    options.adapter(source, event);
    return;
  }

  if (callLevelMethod(source, "success", event)) return;
  if (callEventSink(source, event)) return;

  const fallback = fallbackLogger(options.fallback ?? "console", fallbackLevel("success"));
  fallback("logger.loader", message);
}

export { logPackageInitialized };
