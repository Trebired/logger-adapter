type LoggerAdapterLevel = "error" | "fail" | "info" | "success" | "warn" | (string & {});

type LoggerAdapterLogMethod = (group: string, message: string, metadata?: unknown) => unknown;
type LoggerAdapterNormalizedLogMethod = (
  level: LoggerAdapterLevel,
  group: string,
  message: string,
  metadata?: unknown,
) => unknown;

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

type LoggerAdapterLoggerObject = {
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

type LoggerAdapterLogger = LoggerAdapterEventSink | LoggerAdapterLoggerObject;

type LoggerAdapterFallback = "console" | "noop";

type LoggerAdapterDefaultLoggerFactory = (source: string) => LoggerAdapterLogger | null | undefined;

type LoggerAdapterDefaultLogger = LoggerAdapterDefaultLoggerFactory | LoggerAdapterLoggerObject;

type LoggerAdapterResolveOptions = {
  adapter?: LoggerAdapterWriter;
  defaultLogger?: LoggerAdapterDefaultLogger | false;
  fallback?: LoggerAdapterFallback;
  logger?: LoggerAdapterLogger;
  source: string;
};

type NormalizedLoggerAdapter = {
  error: LoggerAdapterLogMethod;
  fail: LoggerAdapterLogMethod;
  info: LoggerAdapterLogMethod;
  log: LoggerAdapterNormalizedLogMethod;
  warn: LoggerAdapterLogMethod;
};

export type {
  LoggerAdapterEvent,
  LoggerAdapterEventSink,
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
};
