import { installLogNamespaceGuard } from "./guard/install.js";

export { logPackageInitialized } from "./package/init.js";
export { installLogNamespaceGuard } from "./guard/install.js";
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

installLogNamespaceGuard();
