import { resolveConfiguredDefaultLogger } from "#baraacncu5kl";
import { callEventSink, callLevelMethod } from "#g37d0m22fyfl";
import { buildLogEvent } from "#h7r5guzmkuvo";
import { fallbackLevel, fallbackLogger } from "#op66hzcikawq";
import type { LoggerAdapterResolveOptions } from "#903rjwb52opy";
import { applyInitializationGroupPrefix } from "#br5q34hru3ot";
import { buildPackageLogGroup, PACKAGE_ORGANIZATION_NAME } from "#wp3l0xg0zcet";

type LoggerAdapterInitializationOptions = LoggerAdapterResolveOptions& {
  group?: string;
};

function buildInitializationGroup(source: string, group?: string, groupPrefix?: false | string): string {
  if (groupPrefix) return applyInitializationGroupPrefix(group, groupPrefix);

  const raw = String(group || "").trim() || String(source || "").trim();
  const normalized = raw.replace(new RegExp("^@[^/]+/"), "").replace(new RegExp("\\.initialize$"), "");
  const scopeMatch = new RegExp("^@([^/]+)/").exec(String(source || ""));
  const root = scopeMatch ? scopeMatch[1] : PACKAGE_ORGANIZATION_NAME;
  const scoped = root && normalized !== root && !normalized.startsWith(`${root}.`)
  ? `${root}.${normalized}`
  : normalized;
  return scoped ? `${scoped}.initialize` : buildPackageLogGroup("initialize");
}

function logPackageInitialized(options: LoggerAdapterInitializationOptions): void {
  const source = options.adapter
  ? options.logger
  : options.logger ?? resolveConfiguredDefaultLogger(options.defaultLogger, options.source);
  const group = buildInitializationGroup(options.source, options.group, options.groupPrefix);
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
