type LoggerAdapterLevel = "error" | "fail" | "info" | "success" | "warn";

type LoggerAdapterLogMethod = (group: string, message: string, metadata?: unknown) => unknown;

type LoggerAdapterGenericLogMethod = (...args: unknown[]) => unknown;

type LoggerAdapterEvent = {
  group: string;
  level: LoggerAdapterLevel;
  message: string;
  metadata?: unknown;
  timestamp?: string;
};

type LoggerAdapterResolvedEvent = LoggerAdapterEvent & {
  timestamp: string;
};

type LoggerAdapterWriter = (logger: unknown, event: LoggerAdapterResolvedEvent) => unknown;

type LoggerAdapterEventSink = (event: LoggerAdapterEvent) => unknown;

type LoggerAdapterLogger = LoggerAdapterEventSink | {
  [key: string]: unknown;
  error?: LoggerAdapterLogMethod | LoggerAdapterGenericLogMethod;
  fail?: LoggerAdapterLogMethod | LoggerAdapterGenericLogMethod;
  fatal?: LoggerAdapterGenericLogMethod;
  info?: LoggerAdapterLogMethod | LoggerAdapterGenericLogMethod;
  log?: LoggerAdapterGenericLogMethod;
  success?: LoggerAdapterLogMethod | LoggerAdapterGenericLogMethod;
  warn?: LoggerAdapterLogMethod | LoggerAdapterGenericLogMethod;
  write?: LoggerAdapterGenericLogMethod;
};

type LoggerAdapterFallback = "console" | "noop";

type LoggerAdapterResolveOptions = {
  adapter?: LoggerAdapterWriter;
  fallback?: LoggerAdapterFallback;
  logger?: LoggerAdapterLogger;
  source: string;
};

type NormalizedLoggerAdapter = {
  error: LoggerAdapterLogMethod;
  fail: LoggerAdapterLogMethod;
  info: LoggerAdapterLogMethod;
  warn: LoggerAdapterLogMethod;
};

export type {
  LoggerAdapterEvent,
  LoggerAdapterEventSink,
  LoggerAdapterFallback,
  LoggerAdapterGenericLogMethod,
  LoggerAdapterLevel,
  LoggerAdapterLogger,
  LoggerAdapterLogMethod,
  LoggerAdapterResolveOptions,
  LoggerAdapterResolvedEvent,
  LoggerAdapterWriter,
  NormalizedLoggerAdapter,
};
