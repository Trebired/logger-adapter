import { callEventSink, callLevelMethod } from "./emit.js";
import { buildLogEvent } from "./event.js";
import { fallbackLevel, fallbackLogger } from "./fallback.js";
import { tryResolveDefaultLogger } from "./default-logger.js";
import type { LoggerAdapterResolveOptions } from "./types.js";

type LoggerAdapterInitializationOptions = LoggerAdapterResolveOptions & {
  group?: string;
};

function buildInitializationGroup(source: string, group?: string): string {
  const raw = String(group || "").trim() || String(source || "").trim();
  const normalized = raw.replace(/^@[^/]+\//, "").replace(/\.initialize$/, "");
  return normalized ? `${normalized}.initialize` : "package.initialize";
}

function logPackageInitialized(options: LoggerAdapterInitializationOptions): void {
  const source = options.adapter ? options.logger : options.logger ?? tryResolveDefaultLogger(options.source);
  const group = buildInitializationGroup(options.source, options.group);
  const message = `${options.source} initialized`;
  const event = buildLogEvent("success", group, message);

  if (typeof options.adapter === "function") {
    options.adapter(source, event);
    return;
  }

  if (callLevelMethod(source, "success", event)) return;
  if (callEventSink(source, event)) return;

  const fallback = fallbackLogger(options.fallback ?? "console", fallbackLevel("success"));
  fallback(group, message);
}

export { logPackageInitialized };
