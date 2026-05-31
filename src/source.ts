import type {
  LoggerAdapterGenericLogMethod,
  LoggerAdapterLogger,
} from "./types.js";
import { isRecord } from "./values.js";

function getLoggerMethod(source: LoggerAdapterLogger | null | undefined, name: string): LoggerAdapterGenericLogMethod | null {
  if (!isRecord(source)) return null;
  const value = source[name];
  return typeof value === "function" ? value as LoggerAdapterGenericLogMethod : null;
}

function looksLikeTrebiredLogger(source: LoggerAdapterLogger | null | undefined): boolean {
  return Boolean(
    getLoggerMethod(source, "fail")
      || getLoggerMethod(source, "group")
      || getLoggerMethod(source, "withScope")
      || getLoggerMethod(source, "flush")
      || getLoggerMethod(source, "getStats"),
  );
}

function looksLikeObjectFirstLevelLogger(source: LoggerAdapterLogger | null | undefined): boolean {
  if (!isRecord(source)) return false;
  return Boolean(
    getLoggerMethod(source, "child")
      || getLoggerMethod(source, "bindings")
      || (source.levels && typeof source.levels === "object"),
  );
}

export { getLoggerMethod, looksLikeObjectFirstLevelLogger, looksLikeTrebiredLogger };
