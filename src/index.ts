export { logPackageInitialized } from "./package/init.js";
export { resolveLogger } from "./resolve/logger.js";

export type {
  LoggerAdapterEvent,
  LoggerAdapterDefaultLogger,
  LoggerAdapterDefaultLoggerFactory,
  LoggerAdapterFallback,
  LoggerAdapterGenericLogMethod,
  LoggerAdapterLevel,
  LoggerAdapterLogger,
  LoggerAdapterLoggerObject,
  LoggerAdapterLogMethod,
  LoggerAdapterNormalizedLogMethod,
  LoggerAdapterResolveOptions,
  LoggerAdapterResolvedEvent,
  LoggerAdapterWriter,
  NormalizedLoggerAdapter,
} from "./types.js";
