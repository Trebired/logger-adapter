import { buildStructuredPayload, formatLogMessage } from "./event.js";
import { getLoggerMethod, looksLikeObjectFirstLevelLogger, looksLikeTrebiredLogger } from "./source.js";
import type {
  LoggerAdapterLevel,
  LoggerAdapterLogger,
  LoggerAdapterResolvedEvent,
} from "./types.js";

function callEventSink(source: LoggerAdapterLogger | null | undefined, event: LoggerAdapterResolvedEvent): boolean {
  if (typeof source === "function") {
    source(event);
    return true;
  }

  const sink = getLoggerMethod(source, "write") || getLoggerMethod(source, "log");
  if (!sink) return false;

  sink.call(source, event);
  return true;
}

function callLevelMethod(
  source: LoggerAdapterLogger | null | undefined,
  level: LoggerAdapterLevel,
  event: LoggerAdapterResolvedEvent,
): boolean {
  const alias = level === "fail" ? "fatal" : level;
  const method = getLoggerMethod(source, level) || getLoggerMethod(source, alias);
  if (!method) return false;

  if (looksLikeTrebiredLogger(source)) {
    method.call(source, event.group, event.message, event.metadata);
    return true;
  }

  if (looksLikeObjectFirstLevelLogger(source)) {
    method.call(source, buildStructuredPayload(event), event.message);
    return true;
  }

  if (event.metadata === undefined) {
    method.call(source, formatLogMessage(event.group, event.message));
    return true;
  }

  method.call(source, formatLogMessage(event.group, event.message), event.metadata);
  return true;
}

export { callEventSink, callLevelMethod };
